<script lang="ts" setup>
import { UserResp } from "../gateway/interface/userResp";
import type { MessageResp } from "../gateway/interface/messageResp";
import { isExceedOneMinute } from "../utils/time";
// message：接受消息对象，展示消息内容和头像，并且根据角色调整消息位置。
const props = defineProps<{
  message: MessageResp;
  user: UserResp | undefined;
  position: string;
}>();
// showTime 展示时间
const showTime = (type: string = 'bool'): boolean | string => {
  const time = props.message.create_at
  if (type === 'bool') {
    return isExceedOneMinute(time)
  }
  return time!
}

</script>

<template>
  <!-- 时间分隔条 -->
  <div v-if="showTime('bool')" class="cczj-mt-3 time-divider">
    {{ showTime('string') }}
  </div>
  <div :class="['message-row cczj-mt-4', props.position === 'left' ? 'left' : 'right']">
    <!-- 消息展示，分为上下，上面是头像，下面是消息 -->
    <div class="row">
      <!-- 头像， -->
      <div class="avatar-wrapper">
        <el-avatar v-if="props.position === 'left'" :src="user?.avatar" class="avatar cczj-mr-2" shape="square" />
        <!-- 发送的消息或者回复的消息 -->
        <div class="message cczj-mt-2">
          <p>{{ message.content }}</p>
        </div>
        <el-avatar v-if="props.position === 'right'" :src="user?.avatar" class="avatar cczj-ml-2" shape="square" />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.time-divider {
  font-size: 12px;
  font-family: math;
  font-weight: 100;
  margin-left: 40%;
}

.message-row {
  display: flex;
}

.right {
  justify-content: flex-end !important;
}

.right .row .message {
  background-color: rgb(231, 248, 255);
}

.avatar-wrapper {
  display: flex;
}

.left .row .avatar-wrapper.avatar {
  box-shadow: 20px 20px 20px 3px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
}

.message-row .row .message {
  font-size: 15px;
  padding: 1.5px;
  max-width: 500px;
  border-radius: 7px;
  border: 1px solid rgba(8, 8, 8, 0.1);
  box-shadow: 20px 20px 20px 1px rgba(0, 0, 0, 0.01);
}
</style>