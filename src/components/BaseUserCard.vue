<script lang="ts" setup>
import store from '../store';
import { UserResp } from '../gateway/interface/userResp';
import { getStorageFromKey } from '../utils/storage/config';
import { warnMsg } from '../utils/message/message';

const props = defineProps<{
  user: UserResp;
}>();
const handleSession = () => {
  const token = getStorageFromKey('cczj_token');
  const user = getStorageFromKey('cczj_user');
  if (!token || !user) {
    // 如果token为空说明没有登录，跳转到登录页面
    store.data.setDialogLogin(true)
    return;
  }
  if (user.user_id === props.user.user_id) {
    // 如果通话目标是自己，则不能发起通话
    warnMsg('不能和自己发起通话');
    return;
  }
  store.data.setDialogSessionId(props.user.user_id);
};
</script>

<template>
  <div class="cczj-flex user-card-header">
    <el-avatar :src="props.user.avatar" :size="48" />
    <div class="cczj-ml-5">
      <div style="display: grid;">
        <span class="cczj-mr-3">{{ props.user.nickname }}</span>
        <BaseAuthComponent :role-id="props.user.role.role_id" :text-show="true" />
      </div>
    </div>
  </div>
  <el-button @click="handleSession()" style="width: 100%;" class="cczj-mt-5" type="success">与{{ user.gender === 0 ? '她'
    : '他' }}沟通</el-button>
  <el-divider style="margin: 12px 0;" />
  <div class="cczj-flex user-card-content">
    <div style="display: grid;">
      <span style="text-align: center;">{{ user.collect_count }}</span>
      <span>收藏</span>
    </div>
    <div style="display: grid;">
      <span style="text-align: center;">{{ user.publish_count }}</span>
      <span>发布</span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.user-card-header {
  height: 48px;
}

.user-card-content {
  height: 40px;
  font-size: 16px;
  align-items: center;
  justify-content: space-around;
}
</style>