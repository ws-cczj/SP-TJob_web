<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, watch, shallowRef, unref } from 'vue';
import type { UserResp } from '../gateway/interface/userResp';
import type { PostResp } from '../gateway/interface/postResp';
import type { TagResp } from '../gateway/interface/tagResp';
import { ban, getFeedPost, cancelLikePost, likePost, cancelCollectPost, collectPost, getVisitorPost } from '../gateway/api';
import { getStorageFromKey, setStorage } from '../utils/storage/config';
import { confirmBox, errorMsg, promptBox, successMsg, warnMsg } from '../utils/message/message';
import { getTimeTenMinutes, getTimeToDay, formatTime } from '../utils/time';
import hasPermission from '../utils/permission/permission';
import { Log } from '../utils/log/log';
import { throttle } from 'lodash-es';
import store from '../store';
import router from '../router';

const user = shallowRef(getStorageFromKey('cczj_user') as UserResp || store.data.user)
// 传递user参数
const isDark = shallowRef(getStorageFromKey('theme') as boolean || false);
const refDivSticky = ref<HTMLDivElement>();
// 更新粘性元素的背景色
const updateStickyBgColor = ref(() => { });
// 帖子数据
const posts = ref<PostResp[]>([])
// 帖子页数默认0
const pageCount = shallowRef<number>(0)
// 帖子id集合
const postIds = shallowRef<string>('')
const isLoading = shallowRef<boolean>(false)
const getPosts = async () => {
  isLoading.value = true;
  const token = getStorageFromKey('cczj_token')
  if (!token) {
    const data = await getVisitorPost(pageCount.value, postIds.value)
    if (!data) {
      Log.error('views/ThePost', '获取帖子失败')
      errorMsg('请联系管理员！')
      return
    }
    Log.info('views/ThePost', '获取帖子成功', data)
    if (data.posts.length > 0) {
      data.posts.forEach((post: PostResp, index: number) => {
        posts.value.push(post)
        if (index === data.posts.length - 1) {
          postIds.value += post.id
        } else {
          postIds.value += post.id + ','
        }
      })
    }
  } else {
    const data = await getFeedPost(pageCount.value, postIds.value)
    if (!data) {
      Log.error('views/ThePost', '获取帖子失败')
      errorMsg('请联系管理员！')
      return
    }
    Log.info('views/ThePost', '获取帖子成功', data)
    setStorage('cczj_token', data.token)
    if (data.posts.length > 0) {
      data.posts.forEach((post: PostResp, index: number) => {
        posts.value.push(post)
        if (index === data.posts.length - 1) {
          postIds.value += post.id
        } else {
          postIds.value += post.id + ','
        }
      })
    }
  }
  // 页表++防止监听事件重复执行
  pageCount.value++
  isLoading.value = false;
}
getPosts();
// 跳转到详情页
const handleToDeatails = (postId: number) => {
  window.open(router.resolve({ name: 'details', params: { postId: postId } }).href, '_blank')
}
// 更新tags
const updateTags = (postId: number, tags: TagResp[]) => {
  posts.value.forEach((post) => {
    if (post.id === postId) {
      post.tags = tags
      return;
    }
  })
  console.log('更新tags', posts)
  // TODO 数据库更新tags
}
// 从内容提取描述
const extractDescription = (content: string) => {
  // 新增步骤：移除所有代码块内容（包括``````及其包裹的内容）
  var realContent = ''
  realContent = content.replace(/```[\s\S]*?```/g, '');
  const endThemeIdx = realContent.indexOf('---', 3);
  if (endThemeIdx !== -1) {
    realContent = realContent.slice(endThemeIdx + 3)
  }
  // 查找#开头的内容
  const startIndex = realContent.indexOf('#');
  // 截取#之后的全部内容[4]()[10]()
  realContent = realContent.substring(startIndex + 1);
  // 正则表达式清理Markdown格式字符[2]()[15]()
  realContent = realContent.replace(/(\s*[#>*]+\s*) |(\*\*)/g, '')
    .replace(/\s{2,}/g, ',')
    .replace(/(\[.*?\]\(.*?\))/g, '')
    .replace(/[\r\n]/g, ',')
    .trim();
  return realContent.length > 100 ? realContent.slice(0, 100) : realContent
}
const handleLikePost = throttle(async (postId: number, currentBool: boolean) => {
  if (currentBool) {
    const data = await cancelLikePost(postId, 0)
    if (!data) {
      Log.error('views/ThePost', '取消点赞失败')
      return;
    }
    Log.info('views/ThePost', '取消点赞成功')
    setStorage('cczj_token', data.token)
    posts.value.forEach((post) => {
      if (post.id === postId) {
        post.is_like = false
        post.liked_count--
        return;
      }
    })
  } else {
    const data = await likePost(postId, 0)
    if (!data) {
      Log.error('views/ThePost', '点赞失败')
      return;
    }
    Log.info('views/ThePost', '点赞成功')
    setStorage('cczj_token', data.token)
    posts.value.forEach((post) => {
      if (post.id === postId) {
        post.is_like = true
        post.liked_count++
        return;
      }
    })
  }
}, 200)
// handleCollect 处理收藏
const handleCollect = throttle(async (postId: number, currentBool: boolean) => {
  if (currentBool) {
    const data = await cancelCollectPost(postId)
    if (!data) {
      Log.error('views/ThePost', '取消收藏失败')
      return;
    }
    Log.info('views/ThePost', '取消收藏成功')
    setStorage('cczj_token', data.token)
    posts.value.forEach((post) => {
      if (post.id === postId) {
        post.is_collect = false
        post.collected_count--
        return;
      }
    })
  } else {
    const data = await collectPost(postId)
    if (!data) {
      Log.error('views/ThePost', '收藏失败')
      return;
    }
    Log.info('views/ThePost', '收藏成功')
    setStorage('cczj_token', data.token)
    posts.value.forEach((post) => {
      if (post.id === postId) {
        post.is_collect = true
        post.collected_count++
        return;
      }
    })
  }
}, 200)
// 删除帖子
const handleDelete = () => {
  confirmBox('确定删除帖子吗？', '确定');
}

// 封禁用户
const handleBan = (targetId: string) => {
  promptBox('封禁用户天数(默认10min): ', '确定').then(async ({ value }) => {
    var banAt = ''
    if (value === null) {
      // 如果是空则默认
      banAt = getTimeTenMinutes()
    } else {
      const dayTime = parseInt(value)
      if (Number.isNaN(dayTime)) {
        warnMsg('格式必须为数字')
        return
      }
      if (dayTime <= 0) {
        warnMsg('日期不能为负')
        return
      }
      banAt = getTimeToDay(dayTime)
    }
    const data = await ban(targetId, banAt)
    if (!data) {
      Log.error('views/ThePost', '封禁失败')
      errorMsg('封禁失败')
      return
    }
    successMsg(`封禁成功, 目标用户${targetId}解封日期为：${banAt}`)
    setStorage('cczj_token', data.token)
  }).catch(() => { })
}

// 推/限流帖子
const handleHot = (_val: number) => {
}
// 监听用户浏览到第几个帖子了
const refListenPost = ref<HTMLDivElement[]>();
const listenUserView = shallowRef<() => void>();
onMounted(() => {
  const divSticky = refDivSticky.value;
  if (divSticky) {
    const stickyTop = divSticky.offsetTop;
    updateStickyBgColor.value = throttle(() => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (isDark.value) {
        // 黑夜模式
        return;
      }
      if (scrollTop + 60 > stickyTop && scrollTop < 266) {
        divSticky.style.background = 'rgb(236, 249, 250)';
      } else if (scrollTop >= 266 && scrollTop < 366) {
        divSticky.style.background = 'rgb(241, 249, 249)';
      } else if (scrollTop >= 366) {
        divSticky.style.background = 'rgb(248, 248, 248)';
      } else {
        divSticky.style.background = 'transparent';
      }
    }, 16);
    window.addEventListener('scroll', updateStickyBgColor.value);
  }
  listenUserView.value = throttle(() => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    // 通过监听用户浏览帖子数，来懒加载帖子
    const listenPost = unref(refListenPost);
    if (listenPost) {
      // 计算当前是第几个帖子
      const index = (unref(pageCount) - 1) * 10 + 5
      if (listenPost.length >= index) {
        if (listenPost[index].offsetTop < scrollTop + window.innerHeight) {
          getPosts();
        }
      }
    }
  }, 300)
  window.addEventListener('scroll', listenUserView.value);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', listenUserView.value!);
  window.removeEventListener('scroll', updateStickyBgColor.value);
});
// 监听黑暗模式的变化
watch(() => store.data.isDark, (newVal) => {
  if (newVal == false) {
    const pageC = document.querySelector('.page-container') as HTMLElement;
    pageC.style.background = 'linear-gradient(180deg, #ecfafa, #f8f8f8)';
    if (refDivSticky.value) {
      refDivSticky.value.style.background = 'transparent';
    }
    // 白天 启用滚动事件处理函数
    window.addEventListener('scroll', updateStickyBgColor.value);
  } else {
    // 黑夜 禁用滚动事件处理函数
    const pageC = document.querySelector('.page-container') as HTMLElement;
    pageC.style.background = 'rgb(8, 8, 8)';
    if (refDivSticky.value) {
      refDivSticky.value.style.background = 'rgb(8, 8, 8)';
    }
    window.removeEventListener('scroll', updateStickyBgColor.value);
  }
});
</script>

<template>
  <el-main class="cczj-main">
    <div class="page-container cczj-pt-5">
      <div class="container">
        <div class="cczj-flex">
          <div class="flex-left">
            <div class="cczj-box">
              <div ref="refDivSticky" class="cczj-sticky cczj-mt--4 cczj-pt-4">
                <div class="cczj-header">
                  <div class="tab-bar cczj-p-5">
                    <span tabindex="-1" class="cczj-cursor-pointer cczj-mr-48">个人</span>
                    <span tabindex="-1" class="cczj-cursor-pointer cczj-mr-48">企业</span>
                    <span tabindex="-1" class="cczj-cursor-pointer">加精</span>
                  </div>
                </div>
              </div>
              <div class="cczj-content cczj-p-5">
                <div class="cczj-list">
                  <div ref="refListenPost" v-for="post in posts" :key="post.id" class="list-window cczj-p-3">
                    <div class="list-top cczj-flex">
                      <el-popover placement="top" :width="230" trigger="hover">
                        <template #reference>
                          <el-avatar :src="post.author.avatar" class="cczj-mr-2" :size="32" />
                        </template>
                        <BaseUserCard :user="post.author" />
                      </el-popover>
                      <div class="user-info">
                        <div class="nickname">
                          {{ post.author.nickname }}
                          <BaseAuthComponent :text-show="false" :role-id="post.author.role.role_id" />
                        </div>
                        <div class="info">
                          <span class="cczj-mr-2">{{ formatTime(post.create_at) }}</span>
                          <span style="line-height: 30px;">
                            <svg t="1739880154795" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                              xmlns="http://www.w3.org/2000/svg" p-id="1374" width="20" height="20">
                              <path
                                d="M471.04 829.952c-73.216 0-127.232-19.2-132.864-21.504-112.64-58.112-153.6-138.752-121.6-239.872 11.776-36.864 64-57.856 83.968-58.88 193.792-8.448 235.776-147.2 236.032-148.48 29.44-124.928 99.84-152.832 100.352-153.088l0.512-0.256 0.768-0.256c17.664-8.96 37.888-13.568 59.648-13.568 44.032 0 81.152 18.688 85.76 20.992 59.392 41.216 93.696 93.952 102.144 156.928 20.736 155.392-120.832 325.376-122.368 327.168-99.072 108.032-213.76 130.816-292.352 130.816z"
                                fill="#45E595" p-id="1375"></path>
                              <path
                                d="M697.856 206.08c39.424 0 73.728 16.384 79.616 19.456 56.064 39.168 88.32 88.832 96.256 148.224 19.712 146.944-112.64 309.248-119.296 317.44-96.256 104.704-207.104 126.72-283.392 126.72-69.12 0-120.576-17.664-128-20.48-106.24-55.04-144.896-130.56-114.944-225.024 9.472-29.696 55.296-49.664 72.96-50.432 202.496-8.96 245.504-151.296 247.296-157.184l0.256-0.512 0.256-0.512c27.136-115.2 88.32-142.08 92.672-144.128l1.024-0.256 1.536-0.768c15.616-8.448 33.792-12.544 53.76-12.544m0-24.064c-20.992 0-43.264 3.84-65.024 14.848 0 0-76.544 27.904-107.776 161.024 0 0-37.632 131.584-225.024 139.776-24.576 1.024-81.408 24.832-94.72 67.072-21.76 68.608-25.088 175.872 128.256 254.464 0 0 57.088 22.528 137.728 22.528 87.04 0 201.728-26.112 301.568-134.912 0 0 274.432-324.608 17.408-502.272-0.256 0.256-41.984-22.528-92.416-22.528z"
                                fill="#0BC473" p-id="1376"></path>
                              <path
                                d="M440.576 561.92h-1.536c-8.448 0-15.104-6.912-15.104-15.36s6.912-15.104 15.36-15.104h1.28c98.816 0 127.232-103.168 127.488-104.192 2.048-8.192 10.496-12.8 18.432-10.752 8.192 2.048 13.056 10.496 10.752 18.432-0.256 1.28-34.816 126.976-156.672 126.976z"
                                fill="#0BC473" p-id="1377"></path>
                            </svg>
                            诚信豆：{{ post.author.bean }} 颗
                          </span>
                        </div>
                      </div>
                      <el-dropdown v-if="user.role.role_id < 20" class="admin-select" trigger="click"
                        placement="bottom">
                        ...
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item @click="handleDelete"
                              v-if="hasPermission(user.role.permission, 'delete')">删除帖子</el-dropdown-item>
                            <el-dropdown-item @click="handleBan(post.author.user_id)"
                              v-if="hasPermission(user.role.permission, 'ban')">封禁用户</el-dropdown-item>
                            <el-dropdown-item @click="handleHot(432)"
                              v-if="hasPermission(user.role.permission, 'update')">推流帖子</el-dropdown-item>
                            <el-dropdown-item @click="handleHot(-432)"
                              v-if="hasPermission(user.role.permission, 'update')">限流帖子</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                    <div @click="handleToDeatails(post.id)" class="list-body">
                      <div class="body-top">
                        <p>{{ post.title }}</p>
                      </div>
                      <div class="body-content">
                        <p>{{ extractDescription(post.content) }}</p>
                        <div class="body-img">
                          <div :style="`width: calc(100% /${5})`" class="image-box cczj-mr-2">
                            <img
                              src="https://desk-fd.zol-img.com.cn/t_s960x600c5/g5/M00/02/03/ChMkJlbKxo2IT63KACN7OztCegEAALHmwPZIQ0AI3tT786.jpg" />
                          </div>
                          <div class="image-box cczj-mr-2">
                            <img
                              src="https://desk-fd.zol-img.com.cn/t_s960x600c5/g5/M00/02/04/ChMkJlbKyFOILgqwAAU1Zymsk68AALIAgFwgVgABTV_720.jpg"
                              alt="" />
                          </div>
                          <div class="image-box cczj-mr-2">
                            <img src="https://b.zol-img.com.cn/sjbizhi/images/11/1080x1920/1592964698813.jpg" alt="" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="list-bottom">
                      <div class="cczj-tag">
                        <BaseTagComponent :post-id="post.id" :tags="post.tags" @update-tags="updateTags" :user="user"
                          :extend="false" />
                      </div>
                      <div class="cczj-interaction">
                        <span :class="post.is_like ? 'active' : ''" @click="handleLikePost(post.id, post.is_like)">
                          <svg t="1738924645254" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="1896" width="20" height="20">
                            <path
                              d="M399.6 958.2C215.1 958.2 65 808.1 65 623.5c0-20.6 16.6-37.2 37.2-37.2s37.2 16.6 37.2 37.2c0 143.5 116.8 260.3 260.3 260.3 45.8 0 90.8-12 130.1-34.8 17.8-10.4 40.6-4.2 50.8 13.5 10.3 17.8 4.2 40.5-13.6 50.8-50.7 29.4-108.6 44.9-167.4 44.9M690.7 846.6c-9.5 0-19-3.6-26.3-10.9-14.5-14.5-14.5-38 0-52.6l210.3-210.4c7.1-7 10.9-16.3 10.9-26.3 0-9.9-3.9-19.3-10.9-26.3-14.1-14-38.5-14-52.5 0L723.4 619c-14.5 14.5-38.1 14.5-52.6 0s-14.5-38.1 0-52.6l98.8-98.8c42-42.1 115.5-42.2 157.7 0 21.1 21.1 32.7 49.1 32.7 78.9 0 29.8-11.6 57.8-32.7 78.9L716.9 835.7c-7.2 7.3-16.7 10.9-26.2 10.9"
                              p-id="1897"></path>
                            <path
                              d="M697.1 623.5c-20.6 0-37.2-16.6-37.2-37.2v-409c0-20.5-16.7-37.2-37.2-37.2s-37.2 16.7-37.2 37.2v297.5c0 20.6-16.6 37.2-37.2 37.2-20.5 0-37.2-16.6-37.2-37.2V177.3c0-61.5 50-111.5 111.5-111.5s111.6 50 111.6 111.5v409c0 20.6-16.6 37.2-37.1 37.2M102.1 660.7c-20.6 0-37.2-16.6-37.2-37.2V512c0-61.5 50-111.5 111.6-111.5 61.5 0 111.5 50 111.5 111.5 0 20.6-16.6 37.2-37.2 37.2s-37.2-16.6-37.2-37.2c0-20.5-16.7-37.2-37.2-37.2s-37.2 16.7-37.2 37.2v111.5c0.1 20.6-16.5 37.2-37.1 37.2"
                              p-id="1898"></path>
                            <path
                              d="M250.9 549.2c-20.6 0-37.2-16.6-37.2-37.2v-37.2c0-61.5 50-111.5 111.5-111.5s111.6 50 111.6 111.5c0 20.6-16.6 37.2-37.2 37.2s-37.2-16.6-37.2-37.2c0-20.5-16.7-37.2-37.2-37.2S288 454.3 288 474.8V512c0.1 20.5-16.6 37.2-37.1 37.2"
                              p-id="1899"></path>
                            <path
                              d="M399.6 512c-20.6 0-37.2-16.6-37.2-37.2v-37.2c0-61.5 50-111.6 111.6-111.6 61.5 0 111.5 50 111.5 111.6 0 20.5-16.6 37.2-37.2 37.2-20.5 0-37.2-16.6-37.2-37.2 0-20.5-16.7-37.2-37.2-37.2s-37.2 16.7-37.2 37.2v37.2c0.1 20.5-16.6 37.2-37.1 37.2"
                              p-id="1900"></path>
                          </svg>
                          {{ post.liked_count }}
                        </span>
                        <span @click="handleCollect(post.id, post.is_collect)" :class="post.is_collect ? 'active' : ''">
                          <svg t="1740377270213" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="1606" width="20" height="20">
                            <path
                              d="M509.606998 143.114488c9.082866 0 17.327644 4.840238 20.996197 12.331863l97.262184 197.441814c5.613858 11.403724 16.663518 19.358907 29.438473 21.216207l223.738737 32.552393c8.420787 1.215688 15.604396 6.851035 18.23327 14.254655 2.520403 7.18361 0.595564 15.062044-5.084808 20.586874L730.253304 601.611947c-8.949836 8.751315-12.994965 21.171182-10.916631 33.370015l38.011732 222.060515c1.325182 7.737218-2.165316 15.426341-8.905834 19.978007-4.088108 2.741437-8.861832 4.155646-13.812587 4.155646-4.022617 0-7.999185-0.972141-11.425214-2.740414L528.149307 775.671215c-5.768377-3.006474-12.155854-4.552689-18.542308-4.552689-6.364965 0-12.727882 1.547239-18.518772 4.552689L296.254819 878.348736c-3.559059 1.855254-7.602142 2.828418-11.668761 2.828418-4.861728 0-9.723455-1.459235-13.546527-4.022617-6.961552-4.684696-10.475586-12.419867-9.127891-20.155039l38.011732-222.016513c2.078335-12.198833-1.988284-24.619724-10.939143-33.370015L125.02397 441.443038c-5.635347-5.492084-7.55814-13.348006-5.061272-20.453844 2.63092-7.481392 9.812483-13.116739 18.298761-14.332427l223.674269-32.552393c12.839423-1.857301 23.867594-9.813506 29.481452-21.216207l97.194646-197.396789C492.325403 147.965983 500.590648 143.114488 509.606998 143.114488M509.606998 104.904235c-24.043602 0-45.922912 13.226233-56.177464 33.95637L356.189863 336.302419l-223.674269 32.54216c-22.983457 3.304256-42.100864 18.718317-49.481971 39.659255-7.381108 21.048385-1.812275 44.23241 14.431687 60.033281l163.916257 160.125931-38.011732 222.016513c-3.868097 22.408359 6.03239 44.819788 25.458835 57.94676 10.69662 7.116071 23.204491 10.784624 35.757388 10.784624 10.298554 0 20.663622-2.475378 30.055526-7.337105l194.987926-102.7205L704.662463 912.072815c9.369392 4.861728 19.712971 7.337105 29.990035 7.337105 12.57541 0 25.082258-3.668553 35.778878-10.784624 19.426445-13.126972 29.305443-35.538401 25.460882-57.94676l-38.012755-222.016513 163.937746-160.125931c16.22145-15.812127 21.810748-38.984896 14.408151-60.033281-7.402597-20.940938-26.51898-36.353976-49.503461-39.659255L663.04767 336.302419l-97.240695-197.441814C555.619962 118.131491 533.695626 104.904235 509.606998 104.904235L509.606998 104.904235z"
                              p-id="1607"></path>
                          </svg>
                          {{ post.collected_count }}
                        </span>
                        <span>
                          <svg t="1738928260432" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="2684" width="20" height="20">
                            <path
                              d="M511.999488 847.882863c-28.734592 0-56.729303-2.604314-83.969807-7.099698L231.232673 960.185602 231.232673 761.40735C128.618486 689.355337 62.772174 578.889433 62.772174 454.825836c0-217.07906 201.129864-393.058051 449.228338-393.058051 248.084146 0 449.228338 175.980014 449.228338 393.058051C961.227826 671.917176 760.083635 847.882863 511.999488 847.882863zM511.999488 117.91762c-217.086932 0-393.074156 150.851707-393.074156 336.907193 0 114.166179 66.421434 214.898395 167.761552 275.820929l-1.768346 130.234133 132.171551-79.455633c30.4487 6.497994 62.117231 10.308787 94.910422 10.308787 217.101258 0 393.073132-150.825101 393.073132-336.907193C905.073644 268.769326 729.10177 117.91762 511.999488 117.91762zM736.614169 510.976694c-31.011542 0-56.154182-25.128307-56.154182-56.150858 0-31.010271 25.14264-56.151881 56.154182-56.151881s56.154182 25.14161 56.154182 56.151881C792.768351 485.848387 767.624687 510.976694 736.614169 510.976694zM511.999488 510.976694c-31.010518 0-56.153158-25.128307-56.153158-56.150858 0-31.010271 25.14264-56.151881 56.153158-56.151881 31.011542 0 56.154182 25.14161 56.154182 56.151881C568.15367 485.848387 543.01103 510.976694 511.999488 510.976694zM287.385831 510.976694c-31.010518 0-56.153158-25.128307-56.153158-56.150858 0-31.010271 25.14264-56.151881 56.153158-56.151881s56.153158 25.14161 56.153158 56.151881C343.53899 485.848387 318.39635 510.976694 287.385831 510.976694z"
                              p-id="2685">
                            </path>
                          </svg>
                          {{ post.comment_count }}
                        </span>
                        <span>
                          <svg t="1738928486832" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="2845" width="20" height="20">
                            <path
                              d="M821.527273 428.683636H539.461818c-12.8 0-23.272727-10.472727-23.272727-23.272727s10.472727-23.272727 23.272727-23.272727H821.527273c12.8 0 23.272727 10.472727 23.272727 23.272727s-10.472727 23.272727-23.272727 23.272727zM146.618182 903.447273c-12.8 0-23.272727-10.472727-23.272727-23.272728V587.869091c0-51.665455 23.738182-101.003636 67.025454-138.938182 48.407273-42.356364 117.061818-66.792727 188.741818-66.792727 12.8 0 23.272727 10.472727 23.272728 23.272727s-10.472727 23.272727-23.272728 23.272727c-60.509091 0-118.225455 20.014545-158.021818 55.156364-33.047273 29.090909-51.2 65.861818-51.2 104.029091v292.305454c0 13.032727-10.472727 23.272727-23.272727 23.272728z"
                              p-id="2846"></path>
                            <path
                              d="M835.490909 431.010909c-6.749091 0-13.498182-3.025455-18.152727-8.610909l-213.876364-262.981818a23.505455 23.505455 0 0 1 3.258182-32.814546 23.505455 23.505455 0 0 1 32.814545 3.258182l213.876364 262.981818c8.145455 10.007273 6.516364 24.669091-3.258182 32.814546-4.421818 3.723636-9.541818 5.352727-14.661818 5.352727z"
                              p-id="2847"></path>
                            <path
                              d="M621.381818 693.992727c-5.12 0-10.24-1.629091-14.661818-5.12a23.272727 23.272727 0 0 1-3.258182-32.814545l213.876364-262.981818a23.272727 23.272727 0 0 1 32.814545-3.258182 23.272727 23.272727 0 0 1 3.258182 32.814545l-213.876364 262.981818c-4.654545 5.585455-11.170909 8.378182-18.152727 8.378182z"
                              p-id="2848"></path>
                          </svg>
                          转发
                        </span>
                      </div>
                    </div>
                  </div>
                  <BaseSkeletonComponent v-show="isLoading" />
                  <BaseSkeletonComponent v-show="isLoading" />
                  <BaseSkeletonComponent v-show="isLoading" />
                </div>
              </div>
            </div>
          </div>
          <div class="flex-right">
            <div>
              <div class="hot-rank">
                <img
                  src="https://static.nowcoder.com/fe/file/site/www-web/prod/1.0.405/imageAssets/fb0f8426d41a5025be30.png"
                  class="top-img">
                <h2 class="hot-text">全站热榜</h2>
                <div class="hot-rank-list">
                  <!-- <BaseSkeletonComponent /> -->
                  <div>
                    <ul class="cczj-hot-list">
                      <li>
                        <a href="#">
                          <div class="hot-rank-list-item">
                            <span class="hot-rank-highlight">1</span>
                          </div>
                          <div class="hot-rank-text">
                            <span>我的成长我的成长我的成长</span>
                          </div>
                          <div class="hot-number cczj-mr-1">1.2W</div>
                          <span class="active">
                            <svg t="1738934849355" class="icon" viewBox="0 0 1024 1024" version="1.1"
                              xmlns="http://www.w3.org/2000/svg" p-id="1241" width="10" height="10">
                              <path
                                d="M814.933 221.867c-140.8 38.4-166.4 153.6-157.866 226.133C558.933 328.533 563.2 196.267 563.2 0c-320 119.467-247.467 469.333-256 576-76.8-64-93.867-221.867-93.867-221.867-85.333 42.667-128 162.134-128 256C85.333 840.533 268.8 1024 499.2 1024s413.867-183.467 413.867-413.867c4.266-136.533-98.134-200.533-98.134-388.266z m0 0"
                                p-id="1242"></path>
                            </svg>
                          </span>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <div class="hot-rank-list-item">
                            <span class="hot-rank-highlight">2</span>
                          </div>
                          <div class="hot-rank-text">
                            <span>我的成长我的成长我的成长</span>
                          </div>
                          <div class="hot-number cczj-mr-1">1.2W</div>
                          <span>
                            <svg t="1738934849355" class="icon" viewBox="0 0 1024 1024" version="1.1"
                              xmlns="http://www.w3.org/2000/svg" p-id="1241" width="10" height="10">
                              <path
                                d="M814.933 221.867c-140.8 38.4-166.4 153.6-157.866 226.133C558.933 328.533 563.2 196.267 563.2 0c-320 119.467-247.467 469.333-256 576-76.8-64-93.867-221.867-93.867-221.867-85.333 42.667-128 162.134-128 256C85.333 840.533 268.8 1024 499.2 1024s413.867-183.467 413.867-413.867c4.266-136.533-98.134-200.533-98.134-388.266z m0 0"
                                p-id="1242"></path>
                            </svg>
                          </span>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <div class="hot-rank-list-item">
                            <span class="hot-rank-highlight">3</span>
                          </div>
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <div class="hot-rank-list-item">
                            <span class="hot-rank-normal">4</span>
                          </div>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <footer class="footer-banner">
              <a href="#">备案信息</a><br>
              <a href="https://www.zhihu.com/certificates" target="_blank"
                rel="noopener noreferrer">广播电视节目制作经营许可证:（京）字第06591号</a>
            </footer>
          </div>
        </div>
      </div>
    </div>
    <el-backtop style="color: var(--project_base_color_hover)" :visibility-height=400 :right="100" :bottom="100" />
  </el-main>
</template>

<style scoped>
.cczj-main {
  padding: 0;
  overflow: visible !important;
}

.page-container {
  background: linear-gradient(180deg, #ecfafa, #f8f8f8);
  background-repeat: no-repeat;
  background-size: 100% 600px;
  width: 100%;
  height: 100%;
}

.page-container .container {
  width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.cczj-flex {
  display: flex;
}

.page-container .flex-left {
  height: -moz-fit-content;
  height: fit-content;
  width: 910px;
}

.cczj-content {
  --cczj-bg-opacity: 1;
  background-color: rgba(255, 255, 255, var(--cczj-bg-opacity));
}

.cczj-content .cczj-list {
  position: relative;
  height: auto;
}

.cczj-sticky {
  position: sticky;
  top: 56px;
  border-bottom: 1px solid #f8f8f8;
  z-index: 100;
}

.cczj-sticky .cczj-header {
  position: relative;
}

.cczj-sticky .cczj-header .tab-bar {
  display: flex;
  border-bottom-width: 1px;
  box-shadow: none;
  white-space: nowrap;
  font-size: 16px;
  line-height: 16px;
  --cczj-bg-opacity: 1;
  background-color: rgba(255, 255, 255, var(--cczj-bg-opacity));
  color: #262727;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  align-items: center;
  width: 100%;
}

.page-container .flex-right {
  margin-left: 20px;
  width: 270px;
}


.cczj-list .list-window {
  border-bottom: 1px solid #f8f8f8;
  padding: 16px 10px;
  transition: all 0.5s ease;
}

.cczj-list .list-window:hover {
  background-color: #f8f8f8;
  border-radius: 5px;
}

.cczj-list .list-top {
  justify-content: flex-start;
  height: 36px;
  margin-bottom: 8px;
}

.cczj-list .list-top .user-info {
  flex-direction: column;
  color: rgb(8, 8, 8);
}

.cczj-list .list-top .user-info .nickname {
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 14px;
  margin-bottom: 8px;
  margin-top: 1px;
}

.cczj-list .list-top .user-info .header-auth {
  margin-left: 5px;
}

.cczj-list .list-top .user-info .info {
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 12px;
  font-size: 12px;
  line-height: 12px;
  color: rgba(187, 187, 187, 1);
}

.cczj-list .list-top .admin-select {
  position: relative;
  top: 0px;
  left: 65%;
  font-size: 20px;
  cursor: pointer;
}

:deep(.el-dropdown-menu__item:not(.is-disabled):focus,
  .el-dropdown-menu__item:not(.is-disabled):hover) {
  color: rgba(187, 187, 187, 1);
}

.cczj-list .list-body {
  align-items: center;
  cursor: pointer;
  margin-bottom: 20px;
}

.cczj-list .list-body .body-top {
  font-size: 20px;
  color: rgb(8, 8, 8);
  margin-bottom: 10px;
}

.cczj-list .list-body .body-content {
  font-family: Arial, Helvetica, sans-serif;
  color: rgba(51, 51, 51, 1);
  line-break: anywhere;
  font-size: 16px;
  line-height: 24px;
  word-break: break-all;
  white-space: pre-wrap;
  width: 100%;
  max-height: 398px;
}

.cczj-list .list-body .body-content>p {
  -webkit-line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.cczj-list .list-body .body-content .image-box {
  height: 138px;
  display: inline-block;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
}

.cczj-list .list-body .body-content .image-box>img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  vertical-align: top;
}

.cczj-list .list-bottom .cczj-interaction {
  font-size: 16px;
  align-items: center;
  color: rgba(153, 153, 153, 1);
  cursor: pointer;
  display: flex;
}

.cczj-list .list-bottom .cczj-interaction>span {
  margin-right: 40px;
}

.cczj-list .list-bottom .cczj-interaction span:hover,
.cczj-list .list-bottom .cczj-interaction span:hover svg,
.cczj-list .list-bottom .cczj-interaction .active,
.cczj-list .list-bottom .cczj-interaction .active svg {
  color: var(--project_base_color_hover);
  fill: var(--project_base_color_hover);
}

.cczj-list .list-bottom .cczj-interaction svg {
  fill: #C6CCDA;
}

/* 右侧 */

.flex-right .top-img {
  width: 100%;
  height: 64px;
  border-radius: 12px;
}

.flex-right .hot-rank {
  width: 270px;
  background-color: rgba(255, 255, 255, 1);
  height: max-content;
  position: relative;
  border-radius: 12px;
}

.flex-right .hot-text {
  color: rgba(34, 34, 34, 1);
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  position: relative;
  top: -50px;
  left: 15px;
}

.flex-right .hot-rank-list {
  height: auto;
  position: relative;
}

.flex-right .hot-rank-list .cczj-hot-list {
  margin-top: -40px;
  padding-bottom: 4px;
  margin-left: 10px;
}

.flex-right .hot-rank-list .cczj-hot-list a {
  width: 245px;
  border-radius: 8px;
  align-items: center;
  cursor: pointer;
  display: flex;
}

.flex-right .hot-rank-list .cczj-hot-list a:hover {
  background-color: rgba(248, 248, 248, 1);
}

.flex-right .hot-rank-list .cczj-hot-list .hot-rank-list-item {
  height: 18px;
  width: 22px;
  margin-left: 8px;
  display: inline-block;
  overflow: hidden;
  position: relative;
}

.flex-right .hot-rank-list .cczj-hot-list .hot-rank-text {
  color: rgba(51, 51, 51, 1);
  font-weight: 400;
  font-size: 14px;
  line-height: 21px;
  padding-bottom: 10px;
  padding-top: 10px;
  overflow: hidden;
  width: 160px;
  display: flex;
  margin-left: 8px;
}

.hot-rank-normal {
  font-size: 15px;
  font-weight: 400;
  color: rgba(153, 153, 153, 1);
}

/* 热度数字高亮 */
.hot-rank-highlight {
  font-size: 15px;
  font-weight: 600;
  color: var(--Re7);
  box-shadow: 2px 10px 5px 0 rgba(255, 0, 10, 1);
}

.flex-right .hot-rank-list .cczj-hot-list .hot-number {
  color: rgba(187, 187, 187, 1);
  font-weight: 400;
  font-size: 10px;
  line-height: 10px;
  text-align: right;
  width: 36px;
}

.flex-right .hot-rank-list .cczj-hot-list svg {
  fill: #C6CCDA
}

.flex-right .hot-rank-list .cczj-hot-list .active svg {
  fill: #d81e06
}

/* 底部 */
.footer-banner {
  width: 270px;
  height: 100px;
  margin-top: 20px;
}

.footer-banner a {
  margin-top: 5px;
  color: var(--el-menu-item-text-color);
}

.footer-banner a:hover {
  color: var(--project_base_color_hover);
}
</style>