<script lang="ts" setup>
import { UserResp } from '../gateway/interface/userResp';

const props = defineProps<{
  user: UserResp;
}>();
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
  <el-button style="width: 100%;" class="cczj-mt-5" type="success">与{{ user.gender === 0 ? '她' : '他' }}沟通</el-button>
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
  height: 40px;
}

.user-card-content {
  height: 40px;
  font-size: 16px;
  align-items: center;
  justify-content: space-around;
}
</style>