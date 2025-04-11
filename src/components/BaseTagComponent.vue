<script lang="ts" setup>
import { ref } from 'vue'
import type { TagResp } from '../gateway/interface/tagResp'
import type { UserResp } from '../gateway/interface/userResp';
import hasPermission from '../utils/permission/permission';
import { createTag } from '../gateway/api'
import { setStorage } from '../utils/storage/config';
import { Log } from '../utils/log/log';
import { warnMsg } from '../utils/message/message';

const props = defineProps<{
  postId: number
  tags: TagResp[]
  extend: boolean
  user: UserResp
}>()
const emit = defineEmits(['updateTags']);

// 判断是否开启删除功能
const isCloable = () => {
  if (props.extend) return true
  return hasPermission(props.user?.role.permission, 'delete')
}

// 处理标签删除事件
const handleClick = (tagId: number) => {
  if (isCloable()) {
    Log.warning('components/BaseTagCompontent', '删除标签', tagId, props.user?.user_id)
    emit('updateTags', props.postId, props.tags.filter(tag => tag.id !== tagId) as TagResp[])
  }
}
// 创建标签
const tagInput = ref<string>('')
const handleEnter = async () => {
  if (tagInput.value === '') {
    Log.info('components/BaseTagCompontent', '标签内容为空', props.user?.user_id)
    warnMsg('标签内容不能为空')
    return
  }
  var flag = false
  if (props.tags !== null) {
    props.tags.forEach((tag) => {
      if (tag.content === tagInput.value && tag.type === typeValue.value) {
        flag = true
        return;
      }
    })
  }
  if (flag) {
    Log.info('components/BaseTagCompontent', '标签已存在', props.user?.user_id)
    warnMsg('标签已存在, 请勿重新创建')
    return
  }
  const data = await createTag({ content: tagInput.value, type: typeValue.value })
  if (!data) {
    Log.error('components/BaseTagCompontent', '创建标签失败')
    return
  }
  setStorage('cczj_token', data.token)
  tagInput.value = ''
  Log.info('components/BaseTagCompontent', '创建标签成功', data.tag)
  if (props.tags === null) {
    emit('updateTags', props.postId, [data.tag] as TagResp[])
    return
  }
  emit('updateTags', props.postId, [...props.tags, data.tag] as TagResp[])
}


const typeValue = ref<'primary' | 'success' | 'info' | 'warning' | 'danger'>('success')
// tag 类型
const types = ref<Array<string>>(['success', 'info', 'warning', 'danger', 'primary'])
</script>

<template>
  <div class="cczj-flex" style="margin-bottom: 10px; height: 100%;">
    <el-tag @close="handleClick(tag.id)" class="tag cczj-mr-2" size="default" v-for="tag in tags" :key="tag.id"
      :closable="isCloable()" :type="tag.type">
      {{ tag.content }}
    </el-tag>
    <div class="cczj-flex" style="width: 100%;" v-if="props.extend">
      <el-select class="tagSelect" v-model="typeValue" style="width: 10%;" :offset="1" :show-arrow="false">
        <el-option v-for="type in types" :key="type" :label="type" :value="type"></el-option>
      </el-select>
      <el-input @keydown.enter="handleEnter" placeholder="来用回车创建标签吧,记得选颜色哦..." class="tagInput"
        v-model="tagInput"></el-input>
    </div>
  </div>
</template>

<style lang="css" scoped>
.tag {
  cursor: pointer;
  margin-top: 5px;
}

.tag:hover {
  background-color: var(--el-fill-color);
}

:deep(.el-select__wrapper) {
  box-shadow: 0 0 0 0 !important;
}

:deep(.el-input__wrapper) {
  background-color: #fff;
}
</style>