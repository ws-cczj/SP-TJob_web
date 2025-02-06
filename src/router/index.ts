import { createRouter, createWebHistory, type Router } from 'vue-router'
const TheIndex = () => import('@/views/TheIndex.vue')

const routes = [
    {path: '/', redirect:''},
    {path: '', name: 'index', meta: {requestAuth: false}, component: TheIndex},
]

const router: Router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router