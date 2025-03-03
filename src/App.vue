<script setup lang="ts">
if (import.meta.env.MODE !== 'development') {
  let firstTime;
  let lastTime;
  setInterval(() => {
    firstTime = Date.now()
    debugger
    lastTime = Date.now()
    if (lastTime - firstTime > 10) {
      window.location.href = "about:blank";
    }
  }, 100)
}
</script>

<template>
  <router-view />
</template>

<style>
/* 滚动条整体 */
::-webkit-scrollbar {
  width: 10px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background: #f1f1f1;
  /* 轨道背景色 */
  border-radius: 3px;
  /* 圆角 */
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  /* 滑块颜色 */
  border-radius: 10px;
  /* 圆角 */
}

/* 滑块悬停效果 */
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.el-container {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-basis: auto;
  flex-direction: row;
  min-width: 0;
}

.el-container .is-vertical {
  flex-direction: column;
}
</style>
