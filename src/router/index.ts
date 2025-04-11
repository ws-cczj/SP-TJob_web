import { createRouter, createWebHistory, type Router } from 'vue-router'
const TheIndex = () => import('@/views/TheIndex.vue')
const TheNotFound = () => import('@/views/TheNotFound.vue')
const ThePost = () => import('@/views/ThePost.vue')
const TheSearch = () => import('@/views/TheSearch.vue')
const ThePostDetails = () => import('@/views/ThePostDetails.vue')
const TheTalk = () => import('@/views/TheTalk.vue')
const TheTest = () => import('@/views/TheTest.vue')

const routes = [
    {path: '/', name: 'index', meta: {requestAuth: false}, component: TheIndex},
    {path: '/notfound', name: 'notfound', meta: {requestAuth: false}, component: TheNotFound},
    {path: '/talk', name: 'talk', meta: {requestAuth: false}, component: TheTalk},
    {path: '/search/:title', name: 'search', meta: {requestAuth: true}, component: TheSearch},
    {path: '/post/:userId', name: 'post', meta: {requestAuth: true}, component: ThePost},
    {path: '/post/details/:postId', name: 'details', meta: {requestAuth: true}, component: ThePostDetails},
    {path: '/test', name: 'test', meta: {requestAuth: true}, component: TheTest},
    {path: '/:pathMatch(.*)*', redirect: '/notfound'}, // notfund
]

const router: Router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router