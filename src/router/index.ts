import { createRouter, createWebHistory, type Router } from 'vue-router'
const TheIndex = () => import('@/views/TheIndex.vue')
const ThePost = () => import('@/views/ThePost.vue')

const routes = [
    {path: '/', name: 'index', meta: {requestAuth: false}, component: TheIndex},
    {path: '/post/:userId', name: 'post', meta: {requestAuth: true}, component: ThePost},
    {path: '/:pathMatch(.*)*', redirect: '/'}, // notfund
]

const router: Router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router