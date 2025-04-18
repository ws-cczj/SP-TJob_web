<script lang="ts" setup>
import { setStorage } from '../utils/storage/config';
import { closeSession } from '../gateway/api';
import type { SessionResp } from '../gateway/interface/messageResp';
import { Log } from '../utils/log/log';
import { errorMsg } from '../utils/message/message';
import { formatTime } from '../utils/time';

// active：用来标记当前会话是否处于选中状态
// session：用于展示的会话信息
const prop = defineProps<{ active: boolean; session: SessionResp }>();
// 定义删除事件，当触发删除事件时会向外部发送被删除的会话。
const emit = defineEmits<{
  delete: [id: number];
}>();
// 当鼠标放到会话上时，会弹出删除图标，点击删除图标调用删除接口并发送删除事件。
const handleDeleteSession = async () => {
  const data = await closeSession(prop.session.id)
  if (!data) {
    Log.error('components', '关闭会话失败');
    errorMsg('删除会话失败，请联系管理员');
    return;
  }
  Log.info('components', '关闭会话成功');
  emit('delete', prop.session.id);
  setStorage('cczj_token', data.token);
};

</script>

<template>
  <!-- 如果处于激活状态则增加 active class -->
  <div :class="['session-item', active ? 'active' : '']">
    <!-- 会话的名称 -->
    <div class="name">{{ session.topic }}</div>
    <!-- 会话内的消息数量和最近修改的时间 -->
    <div class="count-time">
      <div class="count">
        {{ session.messages ? session.messages.length : 0 }}条对话
      </div>
      <div class="time">{{ formatTime(session.update_at) }}</div>
    </div>
    <!-- 当鼠标放在会话上时会弹出遮罩 -->
    <div class="mask"></div>
    <!-- 当鼠标放在会话上时会弹出删除按钮 -->
    <div @click="handleDeleteSession" class="btn-wrapper">
      <el-icon :size="15" class="close">
        <CircleClose />
      </el-icon>
    </div>
  </div>
</template>

<style lang="css" scoped>
.session-item {
  /* 加一下padding不要让会话内容靠边界太近 */
  padding: 12px;
  background-color: white;
  /* 给边界一些圆角看起来圆润一些 */
  border-radius: 10px;
  /* 父相子绝，父元素是相对布局的情况下，子元素的绝对布局是相当于父元素绝对布局。 */
  position: relative;
  /* 当鼠标放在会话上时改变鼠标的样式，暗示用户可以点击。目前还没做拖动的效果，以后会做。 */
  cursor: grab;
  /* 子元素的遮罩一开始会在外面，让溢出的遮罩不显示 */
  overflow: hidden;
}

.session-item .name {
  /* 会话名称字体要大一些 */
  font-size: 14px;
  /* 凸显名称，加粗 */
  font-weight: 700;
  width: 200px;
  /* 加粗后颜色淡一些 */
  color: rgba(black, 0.8);
}

.session-item .count-time {
  /* 增加一些距离 */
  margin-top: 10px;
  /* 让字体小一些不能比会话名称要大（14px） */
  font-size: 10px;
  color: rgba(black, 0.5);
  /* 让消息数量和最近更新时间显示水平显示 */
  display: flex;
  /* 让消息数量和最近更新时间分布在水平方向的两端 */
  justify-content: space-between;
}

/* 当处于激活状态时增加蓝色描边 */
.active {
  /* 增加一些过渡 */
  transition: all 0.12s linear;
  border: 2px solid #1d93ab;
}

.session-item .mask {
  /* 渐变样式 */
  transition: all 0.2s ease-out;
  /* 相当于父亲绝对布局 */
  position: absolute;
  background-color: rgba(8, 8, 8, 0.05);
  /* 和父亲元素一样宽盖住父元素 */
  width: 100%;
  /* 和父亲元素一样高 */
  height: 100%;
  /*位置移到父元素的最上面 */
  top: 0;
  /* 向父元素的最左侧再增加一个父亲元素当前宽度的距离 */
  left: -100%;
  /* 透明度为0 */
  opacity: 0;
}

/* 当鼠标放在会话上时触发下面的css样式*/
.session-item:hover .mask {
  opacity: 1;
  left: 0;
}

/* 删除按钮样式的逻辑和mask类似 */
.session-item .btn-wrapper {
  color: rgba(black, 0.5);
  transition: all 0.2s ease-out;
  position: absolute;
  top: 10px;
  right: -20px;
  z-index: 10;
  opacity: 0;
}

.session-item:hover .btn-wrapper {
  /* 按钮入场，从最右侧滑进去，渐渐变得不透明 */
  opacity: 1;
  right: 20px;
}

.session-item:hover .btn-wrapper:hover {
  cursor: pointer;
}

.session-item.btn-wrapper .edit {
  margin-right: 5px;
}
</style>