<script lang="ts" setup>
import { ref } from 'vue'
const loading = ref(true)
</script>

<template>
  <!-- 内容骨架屏 -->
  <el-skeleton direction="vertical" alignment="flex-start" :loading="loading" animated
    class="content-skeleton cczj-skeleton">
    <template #template>
      <div class="avatar">
        <el-skeleton-item variant="circle" class="cczj-sk-avatar-item" />
        <div class="cczj-sk-text">
          <el-skeleton-item variant="text" style="width: 80px; margin-bottom: 8px;" />
          <el-skeleton-item variant="text" class="cczj-half-width" />
        </div>
      </div>
      <el-skeleton-item class="cczj-sk-item" variant="rect" />
      <div style="padding: 12px 14px 0 0">
        <el-skeleton-item variant="h1" class="cczj-half-width" />
        <el-skeleton-item variant="text" style="width: 75%;margin-top: 8px; margin-right: 16px" />
      </div>
    </template>
  </el-skeleton>
</template>

<style scoped>
.content-skeleton {
  width: 100%;
}

.cczj-skeleton .avatar {
  display: flex;
  align-items: center;
}

.cczj-skeleton .cczj-sk-avatar-item {
  margin-bottom: 12px;
  width: 48px;
  height: 48px;
  background-color: #aaa;
}

.cczj-skeleton .cczj-sk-text {
  display: flex;
  flex-direction: column;
  position: relative;
  bottom: 6npmpx;
  margin-left: 8px;
}

.cczj-skeleton .cczj-sk-item {
  width: 100%;
  height: 100px;
  background-color: #aaa;
}

.cczj-half-width {
  width: 50%;
}
</style>