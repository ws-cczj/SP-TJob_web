<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, shallowRef } from 'vue'
import type { UploadProps, UploadUserFile, UploadRequestOptions } from 'element-plus'
import type { TagResp } from '../gateway/interface/tagResp'
import type { UserResp } from '../gateway/interface/userResp'
import { confirmBox, successMsg } from '../utils/message/message'
import { Log } from '../utils/log/log'
import { getStorageFromKey, setStorage } from '../utils/storage/config'
import { getDraftPosts, publishPost, saveUnloadBefore } from '../gateway/api'
import router from '../router'

const user = shallowRef(getStorageFromKey('cczj_user') as UserResp)
// 帖子整体数据
const post = reactive({
  id: <number>0,
  title: <string>'',
  tags: <TagResp[]>[],
  content: <string>'',
  images: <UploadUserFile[]>[{
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  }]
})
const openUpload = shallowRef<boolean>(false)
// 上传图片
const uploadImage = async (_options: UploadRequestOptions) => {
  Log.info('views/ThePost', 'todo 上传图片')
}

const dialogImageUrl = shallowRef('')
const dialogVisible = shallowRef(false)
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  Log.info('views/ThePost', '打开缩略图')
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}
// 处理发布文章
const handlePublish = () => {
  if (post.title.trim() === '') {
    confirmBox('标题不能为空', '确定', 'warning').then(() => {
    }).catch(() => { });
    return
  }
  confirmBox('确定要发布文章吗？', '确定', 'success').then(async () => {
    // 1. 装填图片上传信息
    const formdata = new FormData()
    post.images.forEach((file) => {
      formdata.append('file', file.raw!)
    })
    // 2. TODO 上传图片
    // 3. 组装标签ids
    var tagIds = ''
    post.tags.forEach((tag) => {
      tagIds += tag.id + ','
    })
    if (tagIds[tagIds.length - 1] === ',') {
      tagIds = tagIds.substring(0, tagIds.length - 1)
    }
    Log.info('views/ThePost', '组装帖子标签ids', tagIds)
    // 4. 发布帖子
    const data = await publishPost({ postId: post.id, title: post.title, content: post.content, tagIds: tagIds })
    if (!data) {
      Log.error('views/ThePost', '发布帖子失败')
      return
    }
    successMsg('发布帖子成功')
    Log.info('views/ThePost', '发布帖子成功', data)
    setStorage('cczj_token', data.token)
    router.push({
      path: '/post/details/' + post.id,
      query: {
        post: JSON.stringify(post),
      }
    })
  }).catch(() => { });
}

// 更新tags
const updateTags = (_postId: number, tags: TagResp[]) => {
  // 此处一定会发生改变，所以不需要深层次比较
  post.tags = tags
}
// 更新content
const updateContent = (content: string) => {
  post.content = content
}
// getDraft 获取草稿箱
const getDraft = async () => {
  const data = await getDraftPosts()
  if (!data) {
    Log.error('views/ThePost', '获取草稿箱失败')
    return
  }
  Log.info('views/ThePost', '获取草稿箱成功', data)
  // 2. 装填草稿箱信息
  const endDraft = data.posts[data.posts.length - 1]
  post.id = endDraft.id
  post.title = endDraft.title
  post.tags = endDraft.tags
  post.content = endDraft.content
  setStorage('cczj_token', data.token)
}
getDraft()
// 监听 beforeunload 事件
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// 移除监听事件
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// handleBeforeUnload 关闭事件处理函数
const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
  var tagIds = ''
  post.tags.forEach((tag) => {
    tagIds += tag.id + ','
  })
  if (tagIds[tagIds.length - 1] === ',') {
    tagIds = tagIds.substring(0, tagIds.length - 1)
  }
  Log.info('views/ThePost', '组装帖子标签ids', tagIds)
  saveUnloadBefore({ postId: post.id, tagIds: tagIds, title: post.title, content: post.content }).then((data) => {
    if (!data) {
      Log.error('views/ThePost', '保存草稿箱失败')
      return
    }
    Log.info('views/ThePost', '保存草稿箱成功', data)
    setStorage('cczj_token', data.token)
  })
}
</script>

<template>
  <div class="cczj-app">
    <BaseHeaderComponent />
    <div class="container">
      <div class="post">
        <div class="post-header">
          <div @click="openUpload = true" class="post-img-box">
            <svg t="1739763566278" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
              p-id="1342" width="35" height="35">
              <path
                d="M432.888596 655.403778 359.342127 553.64633C349.598306 540.164971 333.800712 540.16511 324.05699 553.64633L188.471613 741.23959C178.727792 754.72095 184.541661 765.649501 201.457031 765.649501L447.704979 765.649501 822.658642 765.649501C839.583509 765.649501 845.267916 754.74485 835.42945 741.293282L620.563382 447.519305C610.659782 433.978682 594.773609 434.067737 584.935143 447.519305L432.888596 655.403778 432.888596 655.403778Z"
                fill="#979797" p-id="1343"></path>
              <path d="M273.271058 347.873852a58.4 58.4 0 1 0 119.364471 0 58.4 58.4 0 1 0-119.364471 0Z" fill="#979797"
                p-id="1344"></path>
              <path
                d="M109.081528 198.668263 914.918473 198.668263C906.5326 198.668263 899.934531 191.991158 899.934531 183.80075L899.934531 840.19925C899.934531 831.991651 906.565377 825.331737 914.918473 825.331737L109.081528 825.331737C117.4674 825.331737 124.065469 832.008842 124.065469 840.19925L124.065469 183.80075C124.065469 192.008349 117.434624 198.668263 109.081528 198.668263ZM64.383234 840.19925C64.383234 864.812398 84.345684 885.013972 109.081528 885.013972L914.918473 885.013972C939.585548 885.013972 959.616766 864.894939 959.616766 840.19925L959.616766 183.80075C959.616766 159.187602 939.654316 138.986028 914.918473 138.986028L109.081528 138.986028C84.414452 138.986028 64.383234 159.105061 64.383234 183.80075L64.383234 840.19925Z"
                fill="#979797" p-id="1345"></path>
            </svg>
          </div>
          <el-input placeholder="请输入标题..." v-model="post.title" class="title" />
          <span class="tips">内容会自动被保存...</span>
          <el-button class="save-btn" type="success">草稿箱</el-button>
          <el-button @click="handlePublish" class="post-btn" type="success">点击发布</el-button>
        </div>
        <div class="post-tag">
          <BaseTagComponent @update-tags="updateTags" :post-id="post.id" :tags="post.tags" :extend="true"
            :user="user" />
        </div>
        <div class="post-body">
          <BaseMarkDown @update-Content="updateContent" :mode="'editor'" :post-id="post.id" :content="post.content" />
        </div>
      </div>
    </div>
    <el-dialog v-model="openUpload" width="500" title="上传图片">
      <el-upload v-model:file-list="post.images" :http-request="uploadImage" list-type="picture-card"
        :on-preview="handlePictureCardPreview">
        <el-icon>
          <Plus />
        </el-icon>
      </el-upload>
      <span>
        jpg/png files with a size less than 500kb
      </span>
      <el-dialog v-model="dialogVisible">
        <img w-full :src="dialogImageUrl" alt="Preview Image" />
      </el-dialog>
    </el-dialog>
  </div>
</template>

<style scoped>
.cczj-app {
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color);
  overflow: hidden;
}

.container {
  width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
  background-color: var(--el-fill-color);
}

.container .post {
  margin: 0 auto;
  height: 100%;
  margin-top: 20px;
  border-radius: 5px;
  overflow: inherit;
}

@media only screen and (max-width: 1024px) {
  .container .post {
    width: 800px;
  }
}

@media only screen and (min-width: 1025px) and (max-width: 1536px) {
  .container .post {
    width: 1000px;
  }

  .title {
    width: 65%;
  }
}

@media only screen and (min-width: 1537px) {
  .container .post {
    width: 1400px;
  }

  .title {
    width: 75%;
  }
}

.container .post .post-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  margin: 0 1px;
  background-color: #fff;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}

.container .post .post-header .post-img-box {
  width: 40px;
  height: 40px;
  align-items: center;
  padding: 5px;
  cursor: pointer;
}

:deep(.is-focus) {
  box-shadow: 0 0 0 0 !important;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 0 !important;
}

.container .post .post-header .tips {
  margin-left: 25px;
  color: #999;
  font-size: 10px;
  font-weight: 400;
}

.container .post .post-header .save-btn {
  margin-left: 9px;
  height: 30px;
  border-radius: 5px;
  background-color: #fff;
  color: var(--project_base_color_hover);
  border: 1px solid var(--project_base_color);
  display: inline-block;
  align-items: center;
  transition: all 0.3s;
}

.container .post .post-header .save-btn:hover {
  background-color: var(--el-fill-color);
}

.container .post .post-header .post-btn {
  margin-left: 20px;
  font-size: 16px;
  background-color: var(--project_base_color_hover);
  color: #fff;
  border: none;
  border-bottom-right-radius: 0px;
  height: 40px;
  display: inline-block;
  align-items: center;
  transition: all 0.3s;
}

.container .post .post-header .post-btn:hover {
  background-color: var(--project_base_color);
}

.post-tag {
  border-top: 1px solid #ebeef5;
  background-color: #fff;
  margin: 0 1px 0 1px;
  padding: 0 10px;
  height: 35px;
}

.post-body {
  background-color: #fff;
  margin-bottom: 50px;
  height: 100%;
}
</style>