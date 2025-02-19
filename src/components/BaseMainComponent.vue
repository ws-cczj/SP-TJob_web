<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, watch, reactive } from 'vue';
import { getStorageFromKey } from '../utils/storage/config';
import { throttle } from 'lodash-es';
import type { UserResp } from '../gateway/interface/userResp';
import type { PostResp } from '../gateway/interface/postResp';
import type { TagResp } from '../gateway/interface/tagResp';
import hasPermission from '../utils/permission/permission';
import { confirmBox, promptBox, successMsg, warnMsg } from '../utils/message/message';
import store from '../store';

const user = ref(getStorageFromKey('cczj_user') as UserResp || store.data.user)
// 传递user参数
const isDark = ref(getStorageFromKey('theme') as boolean || false);
const refDivSticky = ref<HTMLDivElement>();
// 更新粘性元素的背景色
const updateStickyBgColor = ref(() => { });
const postList = reactive<PostResp[]>([{
  id: 1,
  views: 100,
  hots: 100,
  collected_count: 100,
  status: 1,
  title: '我是神人!',
  content: '宝子们，这个产品实习生岗位主要是参与AI产品从需求到上线的全流程，还要做调研、推运营、出方案等~我们公司是深圳清华大学研究院智慧能源研发中心🧐，现招聘产品实习生。薪资面议💰岗位要求：要懂AI对产品的变革，有',
  tags: [
    { id: 1, content: '产品经理', type: 'success' },
  ],
  author: {
    id: 1, nickname: '捶捶自己', user_id: '', bean: '1', gender: 0, avatar: '', role: { role_id: 20, description: '普通用户', permission: '' }
  },
  create_at: '2022-02-07 15:34',
  update_at: '2022-02-07 15:34',
}])
// 更新tags
const updateTags = (postId: number, tags: TagResp[]) => {
  postList.forEach((post) => {
    if (post.id === postId) {
      post.tags = tags
      return;
    }
  })
  console.log('更新tags', postList)
  // TODO 数据库更新tags
}
// 从内容提取描述
const extractDescription = (content: string) => {
  const endThemeIdx = content.indexOf('---', 3);
  if (endThemeIdx === -1) {
    return content.length > 100 ? content.slice(0, 100) : content
  }
  var realContent = content.slice(endThemeIdx + 3)
  return realContent.length > 100 ? realContent.slice(0, 100) : realContent
}
// 点赞，评论等 交互事件
const handleInteraction = () => {
};
// 删除帖子
const handleDelete = () => {
  confirmBox('确定删除帖子吗？', '确定');
}

// 封禁用户
const handleBan = (targetId: string) => {
  promptBox('封禁用户天数(默认10min): ', '确定').then(({ value }) => {
    var date = new Date()
    if (value === null) {
      // 如果是空则默认
      date.setMinutes(date.getMinutes() + 10);
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
      date.setDate(date.getDate() + dayTime)
    }
    // 查询目标是否已经被封禁了
    successMsg(`封禁成功, 目标用户${targetId}解封日期为：${date.toLocaleString().replace(/\//g, '-')}`)
  }).catch(() => { })
}

// 推/限流帖子
const handleHot = (_val: number) => {
}
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
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateStickyBgColor.value);
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
                  <BaseSkeletonComponent />
                  <div v-for="post in postList" :key="post.id" class="list-window cczj-p-3">
                    <div class="list-top cczj-flex">
                      <el-avatar :src="post.author.avatar" class="cczj-mr-2" :size="32" />
                      <div class="user-info">
                        <div class="nickname">
                          {{ post.author.nickname }}
                          <BaseAuthComponent :text-show="false" :role-id="post.author.role.role_id" />
                        </div>
                        <div class="info">
                          <span class="cczj-mr-2">{{ post.create_at }}</span>
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
                      <el-dropdown v-if="post.author.role.role_id < 20" class="admin-select" trigger="click"
                        placement="bottom">
                        ...
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item @click="handleDelete"
                              v-if="hasPermission(post.author.role.permission, 'delete')">删除帖子</el-dropdown-item>
                            <el-dropdown-item @click="handleBan('1')"
                              v-if="hasPermission(post.author.role.permission, 'ban')">封禁用户</el-dropdown-item>
                            <el-dropdown-item @click="handleHot(432)"
                              v-if="hasPermission(post.author.role.permission, 'update')">推流帖子</el-dropdown-item>
                            <el-dropdown-item @click="handleHot(-432)"
                              v-if="hasPermission(post.author.role.permission, 'update')">限流帖子</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                    <div class="list-body">
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
                        <span :class="true ? 'active' : ''" @click="handleInteraction()">
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
                          顶
                        </span>
                        <span>
                          <svg t="1738928677652" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="3008" width="20" height="20">
                            <path
                              d="M624.4 65.8C808.9 65.8 959 215.9 959 400.5c0 20.6-16.6 37.2-37.2 37.2s-37.2-16.6-37.2-37.2c0-143.5-116.8-260.3-260.3-260.3-45.8 0-90.8 12-130.1 34.80000001-17.8 10.4-40.60000001 4.2-50.8-13.50000002-10.3-17.8-4.2-40.5 13.59999999-50.79999999 50.7-29.4 108.6-44.9 167.40000001-44.9M333.3 177.4c9.5 0 19 3.6 26.3 10.9 14.5 14.5 14.5 38 0 52.6l-210.3 210.4c-7.1 7-10.9 16.3-10.9 26.3 0 9.89999999 3.9 19.3 10.9 26.3 14.1 14 38.5 14 52.5 0L300.6 405c14.5-14.5 38.1-14.5 52.6 0s14.5 38.1 0 52.6l-98.8 98.8c-42 42.1-115.5 42.2-157.7 0-21.1-21.1-32.7-49.1-32.7-78.9 0-29.8 11.6-57.8 32.7-78.9L307.09999999 188.3c7.2-7.3 16.7-10.9 26.20000001-10.9"
                              p-id="3009"></path>
                            <path
                              d="M326.9 400.5c20.6 0 37.2 16.6 37.2 37.2l0 409c0 20.49999999 16.70000001 37.2 37.2 37.2s37.2-16.70000001 37.2-37.2l0-297.5c0-20.6 16.6-37.2 37.2-37.2 20.49999999 0 37.2 16.6 37.2 37.2L512.9 846.7c0 61.5-50 111.5-111.49999999 111.5s-111.6-50-111.60000001-111.5l0-409c0-20.6 16.6-37.2 37.1-37.2M921.9 363.3c20.6 0 37.2 16.6 37.2 37.2L959.1 512c0 61.5-50 111.5-111.6 111.5-61.5 0-111.5-50-111.49999999-111.5 0-20.6 16.6-37.2 37.2-37.2s37.2 16.6 37.2 37.2c0 20.49999999 16.70000001 37.2 37.2 37.2s37.2-16.70000001 37.2-37.2l-1e-8-111.5c-0.1-20.6 16.5-37.2 37.1-37.2"
                              p-id="3010"></path>
                            <path
                              d="M773.1 474.8c20.6 0 37.2 16.6 37.2 37.2l0 37.2c0 61.5-50 111.5-111.5 111.5s-111.6-50-111.59999999-111.5c0-20.6 16.6-37.2 37.2-37.2s37.2 16.6 37.2 37.2c0 20.49999999 16.70000001 37.2 37.2 37.2S736 569.7 736.00000001 549.2L736.00000001 512c-0.1-20.5 16.6-37.2 37.09999999-37.2"
                              p-id="3011"></path>
                            <path
                              d="M624.40000001 512c20.6 0 37.2 16.6 37.2 37.2l0 37.2c0 61.5-50 111.6-111.60000001 111.60000001-61.5 0-111.5-50-111.5-111.60000001 0-20.49999999 16.6-37.2 37.2-37.2 20.49999999 0 37.2 16.6 37.2 37.2 0 20.49999999 16.70000001 37.2 37.2 37.2s37.2-16.70000001 37.2-37.2l0-37.2c-0.1-20.5 16.6-37.2 37.10000001-37.2"
                              p-id="3012"></path>
                          </svg>
                          踩
                        </span>
                        <span>
                          <svg t="1738980673157" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                            xmlns="http://www.w3.org/2000/svg" p-id="1246" width="20" height="20">
                            <path
                              d="M512 850.368 220.096 538.752c-55.68-59.968-82.432-121.216-79.424-182.208 3.968-78.912 57.216-126.912 59.52-128.896 42.176-35.968 87.232-54.08 134.336-54.08 81.088 0 145.984 53.44 177.408 85.376 31.552-32 96.192-85.376 177.6-85.376 47.104 0 92.16 18.112 134.08 53.76 2.624 2.24 55.808 50.24 59.776 129.152 3.072 60.928-23.68 122.24-79.36 182.144L512 850.368 512 850.368M233.92 266.624c0 0-39.36 36.096-41.792 93.248C190.08 406.272 212.16 454.656 257.792 503.552L512 774.976l254.272-271.424c45.44-49.088 67.712-97.408 65.536-143.68-2.496-57.152-41.792-93.312-42.304-93.632-31.744-27.2-65.536-41.152-100.032-41.152-86.848 0-156.544 87.488-157.248 88.32L511.424 340.032 491.2 312.896C490.944 312.512 421.696 225.152 334.464 225.152 299.968 225.152 266.176 239.104 233.92 266.624L233.92 266.624 233.92 266.624M233.92 266.624 233.92 266.624z"
                              p-id="1247"></path>
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
                          0
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
  left: 75%;
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