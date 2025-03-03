<script lang="ts" setup>
import { cancelCollectPost, cancelLikePost, collectPost, getDetailsPost, getVisitorDetailsPost, likePost } from '../gateway/api';
import type { PostResp } from '../gateway/interface/postResp';
import { nextTick, onMounted, onUnmounted, ref, shallowRef, unref } from 'vue';
import { Log } from '../utils/log/log';
import { getStorageFromKey, setStorage } from '../utils/storage/config';
import { formatTime } from '../utils/time';
import { getProcessor } from 'bytemd';
import { throttle } from 'lodash-es';
import router from '../router';
import store from '../store';
import { successMsg } from '../utils/message/message';

const post = ref<PostResp>();
const getPost = async () => {
  const toPost = router.currentRoute.value.query.post
  if (toPost) {
    post.value = JSON.parse(toPost as string)
    return
  }
  const postId = parseInt(window.location.pathname.split('/').pop()!)
  const token = getStorageFromKey('cczj_token');
  if (token) {
    const data = await getDetailsPost(postId);
    if (!data) {
      Log.error('views/ThePostDetails', '获取文章详情失败', 'postId:', postId);
      return;
    }
    Log.info('views/ThePostDetails', '获取文章详情成功', 'data:', data);
    post.value = data.post;
    setStorage('cczj_token', data.token);
  } else {
    const data = await getVisitorDetailsPost(postId);
    if (!data) {
      Log.error('views/ThePostDetails', '获取文章详情失败', 'postId:', postId);
      return;
    }
    Log.info('views/ThePostDetails', '获取文章详情成功', 'data:', data);
    post.value = data.post;
  }
}
getPost()

const copyLink = (postId: number) => {
  const input = document.createElement('input');
  input.value = window.location.href + router.resolve({ name: 'details', params: { postId: postId } }).href;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  successMsg('帖子链接已复制！');
}

const handleLikePost = throttle(async (postId: number, currentBool: boolean) => {
  if (currentBool) {
    const data = await cancelLikePost(postId, 0)
    if (!data) {
      Log.error('views/ThePost', '取消点赞失败')
      return;
    }
    successMsg('取消点赞成功')
    Log.info('views/ThePost', '取消点赞成功')
    setStorage('cczj_token', data.token)
    post.value!.is_like = false
    post.value!.liked_count--
  } else {
    const data = await likePost(postId, 0)
    if (!data) {
      Log.error('views/ThePost', '点赞失败')
      return;
    }
    successMsg('点赞成功')
    Log.info('views/ThePost', '点赞成功')
    setStorage('cczj_token', data.token)
    post.value!.is_like = true
    post.value!.liked_count++
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
    successMsg('取消收藏成功')
    Log.info('views/ThePost', '取消收藏成功')
    setStorage('cczj_token', data.token)
    post.value!.is_collect = false
    post.value!.collected_count--
  } else {
    const data = await collectPost(postId)
    if (!data) {
      Log.error('views/ThePost', '收藏失败')
      return;
    }
    successMsg('收藏成功')
    Log.info('views/ThePost', '收藏成功')
    setStorage('cczj_token', data.token)
    post.value!.is_collect = true
    post.value!.collected_count++
  }
}, 200)

const ChangeCommentNum = (num: number) => {
  if (post.value?.comment_count) {
    post.value!.comment_count += num;
  }
}

type catalog = {
  tagName: string
  text: string
  children: catalog[]
}
const divideHight = shallowRef<number>(100) // 分割线高度
// 目录结构
const cateList = shallowRef<catalog[]>([])
const offsetTopList = shallowRef() //文档流中锚点距离顶部距离集合
const anchor = shallowRef<number>(0) //当前锚点
/*
 *@Description: 获取目录
 */
const getCataLogData = () => {
  getProcessor({
    plugins: [
      {
        rehype: p =>
          p.use(() => (tree: any) => {
            if (tree && tree.children.length) {
              createCataLog(tree)
            }
          }),
      },
    ],
  }).processSync(unref(post.value)?.content)
}
const createCataLog = (tree: any) => {
  const items: catalog[] = []; // 最终生成的目录
  const stack: catalog[] = []; // 层级跟踪栈

  tree.children
    .filter((item: any) =>
      item.type === 'element' &&
      /^h[1-6]$/i.test(item.tagName) && // 更严格的正则匹配
      !['theme', 'highlight'].some(forbidden =>
        stringifyHeading(item).toLowerCase().includes(forbidden)
      )
    )
    .forEach((node: any, _index: number) => {
      const level = parseInt(node.tagName.charAt(1));
      const text = stringifyHeading(node).trim();

      // 跳过空文本或不符合条件的标题
      if (!text || text.length < 2) return;

      const newItem: catalog = {
        tagName: node.tagName,
        text,
        children: <catalog[]>[],
      };

      // 层级调整算法优化
      while (stack.length > 0) {
        const lastLevel = parseInt(stack[stack.length - 1].tagName.charAt(1));
        if (lastLevel < level) break; // 允许子级
        stack.pop(); // 清除同级或更高级
      }

      // 确定父级
      const parent = stack.length > 0 ? stack[stack.length - 1] : null;
      if (parent) {
        parent.children.push(newItem);
      } else {
        items.push(newItem);
      }

      // 当前项入栈（只有比栈顶级别大的才入栈）
      if (!parent || parseInt(parent.tagName.charAt(1)) < level) {
        stack.push(newItem);
      }
      if (parent) {
        var flag = false
        cateList.value.forEach((item: any) => {
          if (item.text !== parent.text) {
            flag = true
            item.children.push(newItem)
          }
        })
        if (!flag) {
          cateList.value.push(parent)
        }
      }
    });

  cateList.value = items;
};
const stringifyHeading = (node: any): string => {
  let result = ''
  node.children.forEach((item: any) => {
    if (item.type == 'text') {
      result += item.value
    }
  })
  return result
}

/*
 *@Description: 设置锚点ID
 *@MethodAuthor: peak1024
 *@Date: 2023-10-25 17:03:21
 */
const transformToId = () => {
  const dom = document.querySelector('.markdown-body')!
  let children = Array.from(dom.children)
  if (children.length > 0) {
    for (let i = 0; i < children.length; i += 1) {
      const tagName = children[i].tagName
      if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3') {
        const index = unref(cateList).findIndex((item: any) => item.text === children[i].textContent)
        if (index >= 0) {
          children[i].setAttribute('id', `head-${index}`)
        }
      }
    }
  }
}
/**
 * 目录与标题联动问题
 * 1:点击目录滚动到锚点
 * 2:监听滚动-获取滚动位置最近的标签-做目录联动
 */
const scrollToSection = (sectionId: string, index: number) => {
  anchor.value = index
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
}
const getCalcLateTop = () => {
  const mainEl = document.querySelector('.container') as HTMLDivElement
  offsetTopList.value = unref(cateList).map((_item, index) => {
    const element = document.querySelector(`#head-${index}`) as any
    return {
      offsetTop: index === 0 ? mainEl.offsetTop : element.offsetTop,
      anchor: index,
    }
  })
}
const scrollHandle = throttle(() => {
  const curScrollTop = document.documentElement.scrollTop
    || window.scrollY
    || document.body.scrollTop

  let flag = true
  const topList = unref(offsetTopList)
  if (topList && topList.length <= 0) return
  const len = topList.length
  const min = topList[0].offsetTop
  // 滚动的距离 小于 第一个锚点距离顶部的距离
  if (curScrollTop < min) {
    anchor.value = 0
    return
  }
  // 滚动的距离 与 全部锚点距离顶部距离的集合 比较 获取最近的锚点标识
  for (let i = len - 1; i >= 0; i--) {
    const curReference = topList[i].offsetTop // 当前参考值
    if (flag && curScrollTop >= curReference - 100) {
      flag = false
      anchor.value = topList[i].anchor
    }
  }
}, 100)

onMounted(() => {
  setTimeout(() => {
    getCataLogData(); // 只在挂载时执行一次
    nextTick(() => {
      transformToId()
      // 获取内容的所有锚点距离顶部的距离
      getCalcLateTop()
      // 监听页面滚动获取当前第几个锚点
      window.addEventListener('scroll', scrollHandle)
      window.onresize = () => {
        getCalcLateTop()
      }
    })
  }, 300)
})

onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandle)
})
</script>

<template>
  <BaseHeaderComponent />
  <el-main class="details-container">
    <div class="container">
      <div class="row">
        <div class="row-header">
          <h1 class="header-text cczj-mb-5">
            {{ post?.title }}
          </h1>
          <div class="cczj-flex cczj-mb-3 cczj-flex-wrap cczj-box-border">
            <div class="cczj-flex cczj-items-center">
              <a class="cczj-flex cczj-items-center cczj-mr-3" href="#">
                <el-avatar class="cczj-mr-4" :src="post?.author.avatar" :size="32" />
                <span>{{ post?.author.nickname }}</span>
              </a>
              <el-tooltip content="浏览量" placement="top">
                <div class="preRead cczj-mr-3">
                  <svg t="1740554406735" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="1728" width="20" height="20">
                    <path
                      d="M515.2 224c-307.2 0-492.8 313.6-492.8 313.6s214.4 304 492.8 304 492.8-304 492.8-304S822.4 224 515.2 224zM832 652.8c-102.4 86.4-211.2 140.8-320 140.8s-217.6-51.2-320-140.8c-35.2-32-70.4-64-99.2-99.2-6.4-6.4-9.6-12.8-16-19.2 3.2-6.4 9.6-12.8 12.8-19.2 25.6-35.2 57.6-70.4 92.8-102.4 99.2-89.6 208-144 329.6-144s230.4 54.4 329.6 144c35.2 32 64 67.2 92.8 102.4 3.2 6.4 9.6 12.8 12.8 19.2-3.2 6.4-9.6 12.8-16 19.2C902.4 585.6 870.4 620.8 832 652.8z"
                      p-id="1729" fill="#1afa29"></path>
                    <path
                      d="M512 345.6c-96 0-169.6 76.8-169.6 169.6 0 96 76.8 169.6 169.6 169.6 96 0 169.6-76.8 169.6-169.6C681.6 422.4 604.8 345.6 512 345.6zM512 640c-67.2 0-121.6-54.4-121.6-121.6 0-67.2 54.4-121.6 121.6-121.6 67.2 0 121.6 54.4 121.6 121.6C633.6 582.4 579.2 640 512 640z"
                      p-id="1730" fill="#1afa29"></path>
                  </svg>
                  <span>浏览: {{ post?.views }}次</span>
                </div>
              </el-tooltip>
              <el-tooltip content="预计阅读时间" placement="top">
                <div class="preRead">
                  <svg t="1740542353208" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="1698" width="20" height="20">
                    <path d="M512.9 503.4m-184.8 0a184.8 184.8 0 1 0 369.6 0 184.8 184.8 0 1 0-369.6 0Z" fill="#03BD61"
                      p-id="1699"></path>
                    <path
                      d="M512 79.3C273.4 79.3 79.3 273.4 79.3 512S273.4 944.7 512 944.7 944.7 750.6 944.7 512 750.6 79.3 512 79.3z m0 790.9c-197.5 0-358.2-160.7-358.2-358.2S314.5 153.8 512 153.8 870.2 314.5 870.2 512 709.5 870.2 512 870.2z"
                      fill="#23202D" p-id="1700"></path>
                    <path
                      d="M753.7 467.5H548.5V244.2c0-20.6-16.7-37.2-37.2-37.2S474 223.6 474 244.2v260.6c0 20.6 16.7 37.2 37.2 37.2h242.5c20.6 0 37.2-16.7 37.2-37.2s-16.6-37.3-37.2-37.3z"
                      fill="#23202D" p-id="1701"></path>
                  </svg>
                  <span>阅读: {{ Math.ceil((post?.content.length || 400) / 400) }}分钟</span>
                </div>
              </el-tooltip>
              <el-tooltip :content="`最后更新时间: ${formatTime(post?.update_at)}`" placement="top">
                <div v-if="post?.status === 2" class="cczj-flex cczj-items-center time-box">
                  <svg t="1740542632770" class="icon" viewBox="0 -200 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="1861" width="20" height="20">
                    <path
                      d="M276.72381 181.150476c198.704762-46.567619 418.620952 122.88 404.723809 330.605714 16.091429 183.344762-157.013333 355.961905-340.358095 340.358096-181.881905 12.190476-344.259048-159.939048-336.457143-338.895238C0 356.449524 125.074286 211.139048 276.72381 181.150476M315.001905 268.190476v292.327619c82.895238 0.24381 165.790476 0.24381 248.441905 0 0-12.190476-0.487619-36.815238-0.731429-49.249524-65.584762 0-131.169524-0.731429-196.998095 1.219048V268.190476h-50.712381zM829.19619 536.380952h72.655239c0.24381 40.71619 0.24381 81.188571 0.487619 121.904762H1024v73.142857h-121.660952c-0.24381 40.71619-0.24381 81.188571-0.487619 121.904762h-72.655239c-0.24381-40.472381-0.24381-81.188571-0.487619-121.660952-40.472381-0.24381-81.188571-0.24381-121.660952-0.487619v-72.655238c40.472381-0.24381 81.188571-0.24381 121.660952-0.487619 0.24381-40.472381 0.24381-81.188571 0.487619-121.660953z"
                      fill="#2BC825" p-id="1862"></path>
                  </svg>
                  <span class="cczj-mr-3 cczj-mt-3">发布时间: {{ formatTime(post?.create_at) }}</span>
                </div>
                <div class="cczj-flex time-box" v-else>
                  <el-tag type="warning">待审核</el-tag>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="left-slider cczj-flex">
          <div class="sticky-slider">
            <div class="sticky-inner">
              <div v-if="post?.status === 2" class="group">
                <el-button @click="handleLikePost(post.id, post.is_like)" class="isLike cczj-mb-3" circle
                  type="success"><svg t="1740554190728" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="3377" width="32" height="32">
                    <path
                      d="M399.6 958.2C215.1 958.2 65 808.1 65 623.5c0-20.6 16.6-37.2 37.2-37.2s37.2 16.6 37.2 37.2c0 143.5 116.8 260.3 260.3 260.3 45.8 0 90.8-12 130.1-34.8 17.8-10.4 40.6-4.2 50.8 13.5 10.3 17.8 4.2 40.5-13.6 50.8-50.7 29.4-108.6 44.9-167.4 44.9M690.7 846.6c-9.5 0-19-3.6-26.3-10.9-14.5-14.5-14.5-38 0-52.6l210.3-210.4c7.1-7 10.9-16.3 10.9-26.3 0-9.9-3.9-19.3-10.9-26.3-14.1-14-38.5-14-52.5 0L723.4 619c-14.5 14.5-38.1 14.5-52.6 0s-14.5-38.1 0-52.6l98.8-98.8c42-42.1 115.5-42.2 157.7 0 21.1 21.1 32.7 49.1 32.7 78.9 0 29.8-11.6 57.8-32.7 78.9L716.9 835.7c-7.2 7.3-16.7 10.9-26.2 10.9"
                      fill="#1afa29" p-id="3378"></path>
                    <path
                      d="M697.1 623.5c-20.6 0-37.2-16.6-37.2-37.2v-409c0-20.5-16.7-37.2-37.2-37.2s-37.2 16.7-37.2 37.2v297.5c0 20.6-16.6 37.2-37.2 37.2-20.5 0-37.2-16.6-37.2-37.2V177.3c0-61.5 50-111.5 111.5-111.5s111.6 50 111.6 111.5v409c0 20.6-16.6 37.2-37.1 37.2M102.1 660.7c-20.6 0-37.2-16.6-37.2-37.2V512c0-61.5 50-111.5 111.6-111.5 61.5 0 111.5 50 111.5 111.5 0 20.6-16.6 37.2-37.2 37.2s-37.2-16.6-37.2-37.2c0-20.5-16.7-37.2-37.2-37.2s-37.2 16.7-37.2 37.2v111.5c0.1 20.6-16.5 37.2-37.1 37.2"
                      fill="#1afa29" p-id="3379"></path>
                    <path
                      d="M250.9 549.2c-20.6 0-37.2-16.6-37.2-37.2v-37.2c0-61.5 50-111.5 111.5-111.5s111.6 50 111.6 111.5c0 20.6-16.6 37.2-37.2 37.2s-37.2-16.6-37.2-37.2c0-20.5-16.7-37.2-37.2-37.2S288 454.3 288 474.8V512c0.1 20.5-16.6 37.2-37.1 37.2"
                      fill="#1afa29" p-id="3380"></path>
                    <path
                      d="M399.6 512c-20.6 0-37.2-16.6-37.2-37.2v-37.2c0-61.5 50-111.6 111.6-111.6 61.5 0 111.5 50 111.5 111.6 0 20.5-16.6 37.2-37.2 37.2-20.5 0-37.2-16.6-37.2-37.2 0-20.5-16.7-37.2-37.2-37.2s-37.2 16.7-37.2 37.2v37.2c0.1 20.5-16.6 37.2-37.1 37.2"
                      fill="#1afa29" p-id="3381"></path>
                  </svg></el-button>
                <el-button @click="handleCollect(post.id, post.is_collect)" class="cczj-mb-3 cancel" circle
                  type="success">
                  <svg t="1740553614394" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="2018" width="24" height="24">
                    <path
                      d="M509.606998 143.114488c9.082866 0 17.327644 4.840238 20.996197 12.331863l97.262184 197.441814c5.613858 11.403724 16.663518 19.358907 29.438473 21.216207l223.738737 32.552393c8.420787 1.215688 15.604396 6.851035 18.23327 14.254655 2.520403 7.18361 0.595564 15.062044-5.084808 20.586874L730.253304 601.611947c-8.949836 8.751315-12.994965 21.171182-10.916631 33.370015l38.011732 222.060515c1.325182 7.737218-2.165316 15.426341-8.905834 19.978007-4.088108 2.741437-8.861832 4.155646-13.812587 4.155646-4.022617 0-7.999185-0.972141-11.425214-2.740414L528.149307 775.671215c-5.768377-3.006474-12.155854-4.552689-18.542308-4.552689-6.364965 0-12.727882 1.547239-18.518772 4.552689L296.254819 878.348736c-3.559059 1.855254-7.602142 2.828418-11.668761 2.828418-4.861728 0-9.723455-1.459235-13.546527-4.022617-6.961552-4.684696-10.475586-12.419867-9.127891-20.155039l38.011732-222.016513c2.078335-12.198833-1.988284-24.619724-10.939143-33.370015L125.02397 441.443038c-5.635347-5.492084-7.55814-13.348006-5.061272-20.453844 2.63092-7.481392 9.812483-13.116739 18.298761-14.332427l223.674269-32.552393c12.839423-1.857301 23.867594-9.813506 29.481452-21.216207l97.194646-197.396789C492.325403 147.965983 500.590648 143.114488 509.606998 143.114488M509.606998 104.904235c-24.043602 0-45.922912 13.226233-56.177464 33.95637L356.189863 336.302419l-223.674269 32.54216c-22.983457 3.304256-42.100864 18.718317-49.481971 39.659255-7.381108 21.048385-1.812275 44.23241 14.431687 60.033281l163.916257 160.125931-38.011732 222.016513c-3.868097 22.408359 6.03239 44.819788 25.458835 57.94676 10.69662 7.116071 23.204491 10.784624 35.757388 10.784624 10.298554 0 20.663622-2.475378 30.055526-7.337105l194.987926-102.7205L704.662463 912.072815c9.369392 4.861728 19.712971 7.337105 29.990035 7.337105 12.57541 0 25.082258-3.668553 35.778878-10.784624 19.426445-13.126972 29.305443-35.538401 25.460882-57.94676l-38.012755-222.016513 163.937746-160.125931c16.22145-15.812127 21.810748-38.984896 14.408151-60.033281-7.402597-20.940938-26.51898-36.353976-49.503461-39.659255L663.04767 336.302419l-97.240695-197.441814C555.619962 118.131491 533.695626 104.904235 509.606998 104.904235L509.606998 104.904235z"
                      fill="#1afa29" p-id="2019"></path>
                  </svg>
                </el-button>
                <el-button @click="copyLink(post.id)" class="cczj-mb-3 cancel" circle type="success"><svg
                    t="1740554014175" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="2892" width="24" height="24">
                    <path
                      d="M821.527273 428.683636H539.461818c-12.8 0-23.272727-10.472727-23.272727-23.272727s10.472727-23.272727 23.272727-23.272727H821.527273c12.8 0 23.272727 10.472727 23.272727 23.272727s-10.472727 23.272727-23.272727 23.272727zM146.618182 903.447273c-12.8 0-23.272727-10.472727-23.272727-23.272728V587.869091c0-51.665455 23.738182-101.003636 67.025454-138.938182 48.407273-42.356364 117.061818-66.792727 188.741818-66.792727 12.8 0 23.272727 10.472727 23.272728 23.272727s-10.472727 23.272727-23.272728 23.272727c-60.509091 0-118.225455 20.014545-158.021818 55.156364-33.047273 29.090909-51.2 65.861818-51.2 104.029091v292.305454c0 13.032727-10.472727 23.272727-23.272727 23.272728z"
                      fill="#1afa29" p-id="2893"></path>
                    <path
                      d="M835.490909 431.010909c-6.749091 0-13.498182-3.025455-18.152727-8.610909l-213.876364-262.981818a23.505455 23.505455 0 0 1 3.258182-32.814546 23.505455 23.505455 0 0 1 32.814545 3.258182l213.876364 262.981818c8.145455 10.007273 6.516364 24.669091-3.258182 32.814546-4.421818 3.723636-9.541818 5.352727-14.661818 5.352727z"
                      fill="#1afa29" p-id="2894"></path>
                    <path
                      d="M621.381818 693.992727c-5.12 0-10.24-1.629091-14.661818-5.12a23.272727 23.272727 0 0 1-3.258182-32.814545l213.876364-262.981818a23.272727 23.272727 0 0 1 32.814545-3.258182 23.272727 23.272727 0 0 1 3.258182 32.814545l-213.876364 262.981818c-4.654545 5.585455-11.170909 8.378182-18.152727 8.378182z"
                      fill="#1afa29" p-id="2895"></path>
                  </svg></el-button>
                <el-button @click="store.data.setDialogSessionId(post.author.user_id)" class="cancel" circle
                  type="success">聊一下</el-button>
              </div>
            </div>
          </div>
        </div>
        <div class="viewer">
          <BaseMarkDown :mode="'viewer'" :post-id="post?.id || 0" :content="post?.content || ''" />
          <el-divider />
          <BaseCommentComponent v-if="post?.status === 2" @change-num="ChangeCommentNum" :post="post" />
        </div>
        <div class="catalog">
          <div class="catalog-sticky cczj-flex">
            <el-divider :style="`height: ${divideHight}px`" direction="vertical" />
            <!--显示目录-->
            <div class="marker-card">
              <a v-for="(item, index) in cateList" :key="index"
                :class="[{ active: anchor == index }, item.tagName + '-class']" class="marker-item"
                @click="scrollToSection('head-' + index, index)">{{ item.text }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-backtop style="color: var(--project_base_color_hover)" :visibility-height=400 :right="100" :bottom="100" />
  </el-main>
</template>

<style lang="css" scoped>
.details-container {
  --bs-bg-opacity: 1;
  --bs-white-rgb: 255, 255, 255;
  background-color: rgba(var(--bs-white-rgb), var(--bs-bg-opacity)) !important;
  padding-top: 3rem !important;
  padding-bottom: 3rem !important;
}

.container {
  margin: 0 auto;
  max-width: 1320px;
  width: 100%;
}

.row {
  --bs-gutter-x: 24px;
  --bs-gutter-y: 0;
  display: flex;
  flex-wrap: wrap;
  margin-top: calc(-1* var(--bs-gutter-y));
  margin-right: calc(-.5* var(--bs-gutter-x));
  margin-left: calc(-.5* var(--bs-gutter-x));
}

.row .row-header {
  margin: 0 auto !important;
  flex: 0 0 auto;
  width: 58.33333333%;
}

.row-header .header-text {
  font-size: 2rem;
  font-weight: 600;
}

.time-box {
  margin-left: 1rem;
  font-size: 14px;
  font-weight: 100;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
}

.left-slider {
  flex: 0 0 auto;
  width: 16.66666667%;
  justify-content: flex-end !important;
  align-items: flex-start !important;
}

.sticky-slider {
  float: left;
  margin-left: -56px;
  padding-right: 0 !important;
  width: 48px;
  z-index: 999;
}

.sticky-slider .sticky-inner {
  position: fixed;
  transform: translate3d(0px, 130px, 0px);
  top: 0px;
  width: 48px;
}

.group {
  flex-direction: column;
  align-items: center !important;
  justify-content: center;
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.group .isLike {
  width: 48px;
  height: 48px;
  font-size: 16px;
  border-width: 2px;
  background-color: #fff;
  color: var(--project_base_color_hover);
}

.group .el-button {
  margin-left: -12px;
}

.group .cancel {
  border: none;
  background-color: #fff;
  color: var(--project_base_color_hover);
}

.viewer {
  flex: 0 0 auto;
  width: 58.33333333%;
  margin: 0 auto !important;
}

.catalog {
  flex: 0 0 auto;
  width: 16.66666667%;
  padding-left: 20px;
  position: sticky;
  top: 100px;
}

.catalog .catalog-sticky {
  position: fixed;
  margin-right: -56px;
  padding-left: 0 !important;
  width: 48px;
  z-index: 999;
}

.marker-card {
  background-color: #fff;
  padding: 10px;
  display: block !important;
}

.marker-item {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  height: 30px;
  line-height: 30px;
  cursor: pointer;
  display: block;
}

.marker-item.active {
  color: var(--project_base_color);
}

.h2-class {
  margin-left: 10px;
}

.marker-item:hover {
  color: var(--project_base_color_hover);
}

:deep(.markdown-body h1:first-child,
  .markdown-body h2:first-child,
  .markdown-body h3:first-child,
  .markdown-body h4:first-child,
  .markdown-body h5:first-child,
  .markdown-body h6:first-child) {
  margin-top: 0 !important;
}
</style>