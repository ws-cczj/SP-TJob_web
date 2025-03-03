import { createRouter, createWebHistory, type Router } from 'vue-router'
const TheIndex = () => import('@/views/TheIndex.vue')
const ThePost = () => import('@/views/ThePost.vue')
const ThePostDetails = () => import('@/views/ThePostDetails.vue')

const routes = [
    {path: '/', name: 'index', meta: {requestAuth: false}, component: TheIndex},
    {path: '/post/:userId', name: 'post', meta: {requestAuth: true}, component: ThePost},
    {path: '/post/details/:postId', name: 'details', meta: {requestAuth: true}, component: ThePostDetails},
    {path: '/:pathMatch(.*)*', redirect: '/'}, // notfund
]

const router: Router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router