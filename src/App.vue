<script setup lang="ts">
</script>

<template>
  <router-view />
</template>

<style scoped>
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
