<script lang="ts" setup>
import 'bytemd/dist/index.css' // bytemd markdown
import 'highlight.js/styles/vs.css'
import 'juejin-markdown-themes/dist/juejin.min.css';
import { ref } from 'vue'
import { Editor, Viewer } from '@bytemd/vue-next';
import gfm from '@bytemd/plugin-gfm';
import gemoji from '@bytemd/plugin-gemoji';
import highlight from '@bytemd/plugin-highlight';
import frontmatter from '@bytemd/plugin-frontmatter';
import mediumZoom from '@bytemd/plugin-medium-zoom';
import breaks from '@bytemd/plugin-breaks';
import footnotes from "@bytemd/plugin-footnotes"
import mermaid from "@bytemd/plugin-mermaid"
import externalLinks from "@bytemd/plugin-external-links"
import math from "@bytemd/plugin-math"
import { theme } from '../plugins/bytemd-plugin-theme';
// 这里引入json会出错，但是不影响使用，解决不掉
import zhHans from 'bytemd/locales/zh_Hans.json';
import gfmZhHans from '@bytemd/plugin-gfm/locales/zh_Hans.json'
import mermaidZhHans from "@bytemd/plugin-mermaid/locales/zh_Hans.json"
import mathZhHans from "@bytemd/plugin-math/locales/zh_Hans.json"
import { savePostContent } from '../gateway/api';
import { Log } from '../utils/log/log';
const plugins = ref([
  gfm({ locale: gfmZhHans }),
  gemoji(),
  highlight(),
  frontmatter(),
  mediumZoom(),
  breaks(),
  footnotes(),
  math({ locale: mathZhHans }),
  mermaid({ locale: mermaidZhHans }),
  externalLinks({ test: href => href.startsWith('http') }),
  theme({
    theme: 'juejin',
    highlight: 'juejin'
  }),
])
const porps = defineProps<{
  postId: number
  content: string
  mode: string
}>()
const emit = defineEmits(['updateContent'])
const timeout = ref<any>(0)
const handleChange = (value: string) => {
  emit('updateContent', value)
  if (timeout.value) {
    clearTimeout(timeout.value)
  }
  // 标题和标签可以不保存，但安全性考虑内容必须10s保存一次, 避免过于频繁 保存到数据库
  timeout.value = setTimeout(async () => {
    const data = await savePostContent({ postId: porps.postId, content: value })
    if (!data) {
      Log.error('components/BaseMarkDown', '保存帖子内容失败')
      return;
    }
    Log.info('components/BaseMarkDown', '保存帖子内容成功')
  }, 10000)
}
const handlePaste = async (event: any) => {
  // 获取 'html' 格式的数据,数据是一个字符串，而不是实际的DOM元素
  let htmlData = event.clipboardData.getData('text/html');

  // 转成DOM元素
  let parser = new DOMParser();
  let doc: any = parser.parseFromString(htmlData, "text/html");

  // 由于粘贴的是第三方内容，图片需要处理一下
  const images = doc.getElementsByTagName("img");

  if (images.length) {
    let tasks: any = [];
    // 你是否会觉得下面的代码为啥要用images[i]而不用item？ 因为此处的images[i] != item
    Array.from(images).forEach((_item: any, i: number) => {
      // 如果图片不是可信赖的（自己公司的）
      if (!images[i].src.includes("https://img.xxx.com")) {
        // 将第三方图片转成自己公司的，dataset是因为粘贴公众号的内容会发现公众号的图片没有src属性，需要转换一下
        // TODO 
        tasks.push();
      }
    });
    await Promise.all(tasks);
  }
  // TODO 传给后端数据 str
};

const handleUploadImages = async (files: any) => {
  let imgs: any = [];
  for (let index = 0; index < files.length; index++) {
    const item = files[index];
    let fromData = new FormData();
    fromData.append("file", item);
    let res = await uploadImage(fromData);  // 上传到阿里云
    imgs.push({
      title: item.name,
      url: res,
    });
  }
  return imgs;
};
const uploadImage = (data: FormData): string => {
  // 上传图片
  console.log('uploadImage', data)
  return ""
}
</script>

<template>
  <div class="cczj-markdown">
    <Editor v-if="porps.mode === 'editor'" mode="split" placeholder="请输入内容..." :locale="zhHans" :value="porps.content"
      :plugins="plugins" @paste="handlePaste" @change="handleChange" :upload-images="handleUploadImages" />
    <Viewer v-else :locale="zhHans" :value="porps.content" :plugins="plugins" />
  </div>
</template>

<style lang="css" scoped>
:deep(.bytemd) {
  height: calc(100vh - 200px);
  z-index: 999;
}

:deep(.markdown-body pre) {
  overflow: hidden;
}

:deep(div::-webkit-scrollbar) {
  width: 6px;
}

:deep(div::-webkit-scrollbar-track) {
  background: rgb(239, 239, 239);
  border-radius: 2px;
}

:deep(div::-webkit-scrollbar-thumb) {
  background: var(--project_base_color_hover);
  border-radius: 10px;
}

:deep(div::-webkit-scrollbar-thumb:hover) {
  background: var(--project_base_color);
}
</style>