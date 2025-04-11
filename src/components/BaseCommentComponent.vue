<script lang="ts" setup>
import { onMounted, ref, shallowRef, unref } from 'vue';
import type { PostResp } from '../gateway/interface/postResp';
import type { CommentResp } from '../gateway/interface/commentResp';
import { getStorageFromKey, setStorage } from '../utils/storage/config';
import { createComment } from '../gateway/api';
import store from '../store';
import { Log } from '../utils/log/log';
import { errorMsg, warnMsg } from '../utils/message/message';
import { formatTime } from '../utils/time';
import { UserResp } from '../gateway/interface/userResp';

// 根内容
const rootContent = shallowRef<string>('');
const content = ref<string[]>([]);
const props = defineProps<{
  post: PostResp | undefined;
}>();
const emit = defineEmits(['changeNum']);
// 评论列表
const commentList = ref<CommentResp[]>([]);
// 创建评论
const handleCreateComment = async (f_id: number, uniqueId: number, targetId: number | undefined) => {
  if (!judgeLogin()) return;
  if (typeof targetId === 'undefined' || targetId <= 0) {
    errorMsg('请联系管理员');
    return;
  }
  var contentR = '';
  if (f_id === 0) {
    contentR = rootContent.value.trim();
  } else {
    contentR = content.value[uniqueId].trim();
  }
  if (!contentR) {
    warnMsg('请输入评论内容');
    return;
  }
  const data = await createComment({
    f_id: f_id,
    content: contentR,
    target_id: targetId
  });
  if (!data) {
    Log.error('component/BaseCommentComponent', '评论失败');
    errorMsg('评论失败');
    return;
  }
  Log.info('component/BaseCommentComponent', '评论成功');
  setStorage('cczj_token', data.token);
  const user = getStorageFromKey('cczj_user');
  emit('changeNum', 1);
  data.comment.author = user
  if (f_id === 0) {
    rootContent.value = '';
    commentList.value.unshift(data.comment);
  } else {
    content.value[uniqueId] = '';
    const index = commentList.value.findIndex((item) => item.id === f_id);
    if (commentList.value[index].childs == null) {
      commentList.value[index].childs = [];
    }
    commentList.value[index].childs.unshift(data.comment);
  }
}

// 回复显示
const replyShow = ref<boolean[]>([]);
const handleReply = (id: number) => {
  content.value[id] = '';
  if (replyShow.value[id]) {
    replyShow.value[id] = false;
    return;
  }
  replyShow.value[id] = true;
  replyShow.value.forEach((_item, index) => {
    if (index !== id) {
      replyShow.value[index] = false;
    }
  });
}

// 查找回复的目标作者
const findTargetAuthor = (comment: CommentResp, child: CommentResp): UserResp | null => {
  // 先找他是不是回复的人而不是帖子的作者
  if (child.target_id !== child.f_id) {
    // 说明是回复的人而不是帖子的作者
    for (const item of comment.childs) {
      if (item.id === child.target_id) {
        return item.author;
      }
    }
  } else {
    // 如果找不到, 说明是回复帖子的作者
    for (const item of unref(commentList)) {
      if (item.id === child.target_id) {
        return item.author;
      }
    }
  }
  return null
}

const getAuthorName = (comment: CommentResp, child: CommentResp): string => {
  return findTargetAuthor(comment, child)?.nickname || '已删除作者'
}

const getAuthorId = (comment: CommentResp, child: CommentResp): string => {
  return findTargetAuthor(comment, child)?.user_id || '0'
}

// 判断是否登录
const judgeLogin = (): boolean => {
  const token = getStorageFromKey('cczj_token')
  if (!token) {
    store.data.setDialogLogin(true)
    return false
  }
  return true
}
const sortType = shallowRef<string>('new');
// 改变排序方式
const changeSortType = (type: string = 'new') => {
  if (sortType.value === type) {
    return;
  }
  sortType.value = type;
}

onMounted(() => {
  setTimeout(() => {
    commentList.value = props.post?.comments || [];
  }, 500);
})
</script>

<template>
  <div class="comment-container">
    <div class="title">评论 {{ props.post?.comment_count }}</div>
    <div class="comment-editor cczj-mt-5">
      <el-input maxlength="500" show-word-limit @focus="judgeLogin" :resize="'none'" class="input" v-model="rootContent"
        autosize type="textarea" placeholder="来条评论吧~">
        <template #append>
          <el-button type="success" @click="handleCreateComment(0, 0, props.post?.id)">评论</el-button>
        </template>
      </el-input>
      <div class="cczj-flex cczj-mt-3 action-box">
        <span>其他功能待开发中...</span>
        <el-button type="success" @click="handleCreateComment(0, 0, props.post?.id)">评论</el-button>
      </div>
    </div>
    <div class="cczj-mt-5">
      <div class="comment-list-header">
        <span @click="changeSortType('new')" :class="{ active: sortType === 'new' }" class="cczj-mr-2">最新</span>
        |
        <span @click="changeSortType('hot')" :class="{ active: sortType === 'hot' }" class="cczj-ml-2">最热</span>
      </div>
      <div class="comment-list">
        <div v-for="comment in commentList" :key="comment.id" class="root-comment cczj-p-4">
          <el-avatar class="cczj-mr-4" :src="comment.author.avatar" :size="32" />
          <div class="comment-wrapper">
            <div class="cczj-flex cczj-items-center comment-header">
              <span class="cczj-mr-2">{{ comment.author.nickname }}</span>
              <BaseAuthComponent :text-show="true" :role-id="comment.author.role.role_id" />
              <el-tag type="success" v-if="post?.author.user_id === comment.author.user_id">作者</el-tag>
            </div>
            <div class="comment-content cczj-mt-2">
              <div class="content">{{ comment.content }}</div>
            </div>
            <div class="cczj-mt-3 cczj-flex cczj-items-center comment-action">
              <span class="time">{{ formatTime(comment.create_at) }}</span>
              <div class="action cczj-flex cczj-items-center">
                <span class="cczj-mr-3">点赞</span>
                <span @click="handleReply(comment.id)">{{ !replyShow[comment.id] ? '回复' : '取消回复' }}</span>
              </div>
            </div>
            <div v-show="replyShow[comment.id]" class="reply-box cczj-mt-1">
              <el-input maxlength="500" show-word-limit @focus="judgeLogin" :resize="'none'" class="input"
                v-model="content[comment.id]" autosize type="textarea" placeholder="来条评论吧~" />
              <div class="cczj-flex cczj-mt-3 action-box">
                <span>其他功能待开发中...</span>
                <el-button type="success"
                  @click="handleCreateComment(comment.id, comment.id, comment.id)">评论</el-button>
              </div>
            </div>
            <div class="reply-warpper">
              <div class="reply-list cczj-mt-3">
                <div v-for="childComment in comment.childs" :key="childComment.id"
                  class="cczj-flex cczj-mt-3 cczj-plr-2">
                  <el-avatar class="cczj-mr-4" :src="childComment.author.avatar" :size="32" />
                  <div class="comment-wrapper">
                    <div class="cczj-flex cczj-items-center">
                      <span class="cczj-mr-1">{{ childComment.author.nickname }}</span>
                      <el-tag type="success" v-if="post?.author.user_id === childComment.author.user_id">作者</el-tag>
                      回复
                      <span class="cczj-ml-1">{{ getAuthorName(comment, childComment) }}</span>
                      <el-tag type="success"
                        v-if="post?.author.user_id === getAuthorId(comment, childComment)">作者</el-tag>
                      ：
                    </div>
                    <div class="cczj-mt-3 reply-content">
                      <div class="content">{{ childComment.content }}</div>
                    </div>
                    <div class="cczj-mt-3 cczj-flex cczj-items-center reply-action">
                      <span class="time">{{ formatTime(childComment.create_at) }}</span>
                      <div class="action cczj-flex cczj-items-center">
                        <span class="cczj-mr-3">点赞</span>
                        <span @click="handleReply(childComment.id)">{{ !replyShow[childComment.id] ? '回复' : '取消回复'
                        }}</span>
                      </div>
                    </div>
                    <div v-show="replyShow[childComment.id]" class="reply-box cczj-mt-1">
                      <el-input @focus="judgeLogin" :resize="'none'" class="input" v-model="content[childComment.id]"
                        autosize type="textarea" placeholder="来条评论吧~" />
                      <div class="cczj-flex cczj-mt-3 action-box">
                        <span>其他功能待开发中...</span>
                        <el-button type="success"
                          @click="handleCreateComment(comment.id, childComment.id, childComment.id)">评论</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.comment-container {
  border-radius: 4px;
  background-color: #E4F8EA;
  margin-top: 20px;
  padding: 20px;
  padding-bottom: 20px;
  font-style: normal;
  margin-bottom: 100px;
}

.comment-container .title {
  color: #252933;
  font-size: 18px;
  font-weight: 600;
  line-height: 30px;
}

:deep(.el-textarea__inner) {
  min-height: 100px !important;
  height: 100px !important;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--project_base_color_hover);
  outline: none;
}

.action-box {
  justify-content: flex-end;
}

.comment-list-header {
  font-size: 14px;
  font-weight: 400;
  user-select: none;
}

.comment-list-header>span {
  cursor: pointer;
  color: #515767;
}

.active {
  color: var(--project_base_color_hover) !important;
}

.comment-list {
  min-height: 120px;
  margin-top: 4px;
}

.comment-list .root-comment {
  display: flex;
  min-width: 0;
  box-sizing: border-box;
  font-style: normal;
  position: relative;
}

.comment-list .root-comment .comment-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.comment-content {
  padding: 10px;
  background-color: #f6f7f8;
}

.comment-content .content {
  color: var(--juejin-font-1);
  font-size: 16px;
  font-weight: 400;
  line-height: 28px;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
}


.comment-action {
  user-select: none;
}

.time {
  font-size: 12px;
  font-weight: 100;
  color: #8a919f;
}

.comment-action .action {
  width: 82%;
  justify-content: flex-end;
  cursor: pointer;
}

/* 双向动画关键帧 */
@keyframes reply-height {
  0% {
    max-height: 0;
    opacity: 0
  }

  100% {
    max-height: 500px;
    opacity: 1
  }
}

/* 动态类名控制 */
.reply-box {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  animation: reply-height 2s ease forwards;
}

.reply-action {
  user-select: none;
}

.reply-action .action {
  width: 80%;
  justify-content: flex-end;
  cursor: pointer;
}

.reply-content {
  padding: 10px;
  background-color: #f6f7f8;
}

.reply-content .content {
  color: var(--juejin-font-1);
  font-size: 16px;
  font-weight: 400;
  line-height: 28px;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
}
</style>