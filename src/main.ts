import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/base.css'
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { elDrawerDrag } from './directive/element-ui/el-drawer-drag';
import { createPinia } from 'pinia'
import store from './store'
import { registerStore } from './store';
import router from './router/index'

const app = createApp(App)

app.use(createPinia())

app.use(router as any)

app.use(ElementPlus, { locale: zhCn })
app.directive('el-drawer-drag-width', elDrawerDrag)


for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 注册store
registerStore();

// 添加全局变量
app.config.globalProperties.$router = router
app.config.globalProperties.$store = store.data
app.mount('#app')
