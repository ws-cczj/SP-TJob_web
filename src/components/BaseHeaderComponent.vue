<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { ref } from 'vue'
import { smsSend, login, register } from '../gateway/api'
import { alertBox, confirmBox, infoMsg, successMsg } from '../utils/message/message'
import { clearStorage, getStorageFromKey, setStorage } from '../utils/storage/config'
import { Log } from '../utils/log/log'
import BaseThemeMode from './BaseThemeMode.vue'
import type { UserResp } from '../gateway/interface/userResp'
import store from '../store'

// ------------------- 父子通信区 -------------------
const user = ref(getStorageFromKey('cczj_user') as UserResp)
// 登陆弹窗
const dialogLogin = ref(false)
// 搜索内容
const searchInput = ref('')
// 弹窗类型
const dialogType = ref(false)
// 弹窗登录类型
const dialogLoginType = ref(false)
// 处理倒计时
const handleTime = ref(61)
// 复选框
const checked = ref(false)
const refForm = ref<FormInstance | null>(null)
const refFormEmail = ref<FormInstance | null>(null)
const refPhoneLogin = ref({
    mobile: ref<string>(''),
    code: ref<string>('')
})
const refEmailLogin = ref({
    key: ref('16639528057'),
    password: ref('123456')
})

const ruleEmail = ref(<FormRules>{
    key: [{
        required: true,
        message: '请输入邮箱/手机号',
        trigger: 'blur'
    }, {
        pattern: /^(?=.{11,11}$)\d+|.*@.*/,
        message: '请输入正确的邮箱/手机号',
        trigger: 'blur'
    }],
    password: [{
        required: true,
        message: '请输入密码',
        trigger: 'blur'
    }, {
        min: 6,
        max: 20,
        message: '请输入6-20位的密码',
        trigger: 'blur'
    }]
})
const rulePhone = ref(<FormRules>{
    mobile: [{
        required: true,
        message: '请输入手机号',
        trigger: 'blur'
    }, {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号',
        trigger: 'blur'
    }],
    code: [{
        required: true,
        message: '请输入验证码',
        trigger: 'blur'
    }, {
        pattern: /^\d{6}$/,
        message: '请输入正确的验证码',
        trigger: 'blur'
    }]
})
const navs = ref([{
    id: 1,
    name: '首页',
    url: 'https://www.nowcoder.com/'
}, {
    id: 2,
    name: '题库',
    url: 'https://www.nowcoder.com/contestRoom'
}, {
    id: 3,
    name: '课程',
    url: 'https://www.nowcoder.com/courses'
}, {
    id: 4,
    name: '讨论区',
    url: 'https://www.nowcoder.com/discuss'
}, {
    id: 5,
    name: '求职',
    url: 'https://www.nowcoder.com/job'
}, {
    id: 6,
    name: '企业',
    url: 'https://www.nowcoder.com/company'
}
])
// 控制头像抽屉的显示与隐藏
const drawerVisible = ref(false);
const drawerMenuType = ref('collect');
const dailyImage = ref('https://img-baofun.zhhainiao.com/fs/7f66bf9152c32f79205ca3a77a5af6df.jpg')
const dailyinit = () => {
    if (getStorageFromKey('dailyImage')) {
        dailyImage.value = getStorageFromKey('dailyImage')
    } else {
        dailyImage.value = 'https://dailybing.com/api/v1'
        setStorage('dailyImage', dailyImage.value, 60)
    }
}
dailyinit()
// 判断当前路径是否是当前导航
const judgePath = (url: string): Boolean => {
    return url === 'https://www.nowcoder.com/'
}
// 搜索建议回调函数
const querySearchAsync = () => { }
// 点击建议时触发
const drawerWidth = ref('400px')
const handleSelect = () => {
    // 保持抽屉宽度不变
    drawerWidth.value = store.data.drawerWidth + 'px'
}
// 登录注册会话回调函数
const handleClose = (done: () => void) => {
    done()
}
// 验证码发送处理
const handleCodeBtn = async (event: Event) => {
    const buttonE = event.currentTarget as HTMLButtonElement
    // 判断验证码发送频率
    const mobile_obj = getStorageFromKey('mobile_sms');
    if (mobile_obj) {
        if (mobile_obj.t + 60000 > Date.now()) {
            infoMsg('验证码发送过于频繁，请稍后再试')
            return;
        }
        if (mobile_obj.count > 3) {
            infoMsg('验证码发送次数过多，请稍后再试')
            return;
        }
        setStorage('mobile_sms', { count: mobile_obj.count + 1, t: Date.now() }, 60)
    } else {
        // 初始化验证码信息
        setStorage('mobile_sms', { count: 0, t: Date.now() }, 60)
    }
    const data = await smsSend(`/user/smsSend?mobile=${refPhoneLogin.value.mobile}`)
    if (data) {
        const timer = setInterval(() => {
            handleTime.value--
            if (handleTime.value === 0) {
                clearInterval(timer)
                buttonE.disabled = false
                buttonE.style.cursor = 'pointer'
                buttonE.style.background = 'linear-gradient(135deg, #00dcc2, #00dc93)'
                handleTime.value = 61
            }
        }, 1000)
        handleTime.value--
        buttonE.disabled = true
        buttonE.style.cursor = 'not-allowed'
        buttonE.style.background = 'gray'
        successMsg('验证码发送成功')
        Log.info('components/BaseHeaderComponent', '验证码发送成功', data)
    }
}
// 登录注册处理
const handleLoginAndRegisterBtn = () => {
    if (checked.value == false) {
        alertBox('请先同意注册协议和隐私政策', '', 'warning')
        return;
    }
    refForm.value?.validate(async (valid: boolean) => {
        if (valid) {
            // 登录注册处理
            const data = await register('/user/register', refPhoneLogin.value)
            if (!data) {
                Log.error('components/BaseHeaderComponent', '注册失败', data)
                return
            }
            setStorage('cczj_token', data.token)
            setStorage('cczj_user', data.user)
            user.value = data.user
            Log.info('components/BaseHeaderComponent', '注册成功', data)
            dialogLogin.value = false
        }
    })
}
// 登陆处理
const handleLoginBtn = () => {
    refFormEmail.value?.validate(async (valid: boolean) => {
        if (valid) {
            // 登录注册处理
            const data = await login('/user/login', refEmailLogin.value)
            if (!data) {
                Log.error('components/BaseHeaderComponent', '登录失败', data)
                return
            }
            setStorage('cczj_token', data.token)
            setStorage('cczj_user', data.user)
            user.value = data.user
            Log.info('components/BaseHeaderComponent', '登录成功', data)
            dialogLogin.value = false
        }
    })
}
// 判断是否登录
const isLogin = (typeName: string = 'show'): boolean => {
    const token = getStorageFromKey('cczj_token')
    if (typeName === 'show') {
        return token === null || token === undefined
    }
    if (!token) {
        dialogLogin.value = true
    } else {
        window.location.href = 'https://hr.nowcoder.com?utm_channel=nkweb_homepage'
    }
    return true
}
// 退出登录
const Logout = () => {
    confirmBox('确定退出登录吗？', '退出登录', '退出', '取消', () => {
        clearStorage()
        drawerVisible.value = false
        successMsg('退出登录成功')
    })
}
</script>

<template>
    <header class="nav-header">
        <nav>
            <a href="https://www.nowcoder.com/" target="_self" class="logo" style="width:100px;">
                <img src="@/assets/img/cczj_blue_logo.png" alt="logo" />
            </a>
            <ul class="nav-header-menu">
                <li v-for="nav in navs" :key="nav.id" class="hover-class nav-header-menuitem">
                    <a id="nav-home" :href="nav.url" target="_self" class="hover-class nc-nav-header-menu-active">{{
                        nav.name }}</a>
                    <div class="line" v-show="judgePath(nav.url)" />
                </li>
            </ul>
            <div class="nav-header-search">
                <el-autocomplete v-model="searchInput" :trigger-on-focus="false" :fetch-suggestions="querySearchAsync"
                    placeholder="搜索题目" @select="handleSelect">
                    <template #suffix>
                        <div class="cus-search-suffix">
                            <div class="search-suffix-vertical"></div>
                            <span tagtype="span" class="ncicon  ncicon-bleed" style="margin-right:4px;"><svg
                                    focusable="false" viewBox="0 0 1024 1024" fill="currentColor" width="16"
                                    height="16">
                                    <g fill="currentColor" fill-rule="nonzero">
                                        <path
                                            d="M473.5 65C247.8925 65 65 247.8925 65 473.5S247.8925 882 473.5 882 882 699.1075 882 473.5 699.1075 65 473.5 65zm0 96C646.0881 161 786 300.9119 786 473.5S646.0881 786 473.5 786 161 646.0881 161 473.5 300.9119 161 473.5 161z">
                                        </path>
                                        <path
                                            d="M699.0589 699.0589c18.5577-18.5577 48.5304-18.7433 67.3164-.5568l.5658.5568 178 178c18.7452 18.7451 18.7452 49.137 0 67.8822-18.5577 18.5577-48.5304 18.7433-67.3164.5568l-.5658-.5568-178-178c-18.7452-18.7451-18.7452-49.137 0-67.8822z">
                                        </path>
                                    </g>
                                </svg>
                            </span>
                            <span>搜索</span>
                        </div>
                    </template>
                </el-autocomplete>
            </div>
            <div class="header-publish-job-wrap tw-mx-5">
                <el-dropdown placement="bottom-start">
                    <a @click="isLogin('click')"
                        class="recruit tw-flex tw-items-center tw-cursor-pointer el-dropdown-selfdefine"
                        href="javascript:void(0)">
                        我要招人
                        <svg viewBox="0 0 1024 1024" fill="currentColor" width="14" height="14">
                            <path fill="currentColor" fill-rule="nonzero"
                                d="M828.0447 281.2004c17.5625-19.8576 47.8974-21.7181 67.755-4.1557 19.659 17.3869 21.679 47.292 4.6766 67.1561l-.521.5988L571.9255 715.697c-29.2708 33.096-79.829 36.1968-112.925 6.926a80 80 0 0 1-6.1988-6.115l-.7272-.811-328.0298-370.8974c-17.5624-19.8575-15.7019-50.1924 4.1557-67.7549 19.659-17.3868 49.5868-15.7372 67.2242 3.5653l.5307.5904L511.999 638.545l316.0457-357.3446z">
                            </path>
                        </svg>
                    </a>
                    <template #dropdown>
                        <ul>
                            <li tabindex="-1" class="dropdown-item-publish-job">
                                <a @click="isLogin('click')" href="javascript:void(0)" class="tw-flex tw-items-center">
                                    <img src="https://static.nowcoder.com/fe/file/images/web/header/headerPublishJob.png"
                                        class="tw-width-38 tw-mr-2 tw-flex-none">
                                    <div class="tw-flex-auto">
                                        <div style="font-size:16px;line-height:16px;font-weight:500;">
                                            发布职位
                                        </div>
                                        <div class="tw-mt-2 tw-text-gray-600" style="font-size:12px;line-height:12px;">
                                            发布职位、邀约牛人
                                        </div>
                                    </div> <span class="ncicon tw-flex-none  ncicon-bleed"><svg focusable="false"
                                            viewBox="0 0 12 12" fill="currentColor" width="12" height="12">
                                            <defs>
                                                <filter color-interpolation-filters="auto">
                                                    <feColorMatrix in="SourceGraphic"
                                                        values="0 0 0 0 0.647059 0 0 0 0 0.647059 0 0 0 0 0.647059 0 0 0 1.000000 0">
                                                    </feColorMatrix>
                                                </filter>
                                            </defs>
                                            <g fill="none" fill-rule="evenodd">
                                                <path fill="currentColor"
                                                    d="M4.4535.6056a.5273.5273 0 0 1 .7457 0l5.0066 5.0048a.5271.5271 0 0 1 .1527.5215.5248.5248 0 0 1-.1457.249l-5.0132 5.0116a.5273.5273 0 0 1-.7458-.7457l4.6466-4.6472-4.647-4.6482a.5275.5275 0 0 1-.061-.6727z">
                                                </path>
                                            </g>
                                        </svg></span>
                                </a>
                            </li>
                            <li tabindex="-1" class="dropdown-item-more-solution tw-mt-2">
                                <a @click="isLogin('click')" href="javascript:void(0)" class="tw-flex tw-items-center">
                                    <img src="https://static.nowcoder.com/fe/file/images/web/header/headerMoreSolution.png"
                                        class="tw-w-38 tw-mr-2 tw-flex-none">
                                    <div class="tw-flex-auto">
                                        <div style="font-size:16px;line-height:16px;font-weight:500;">
                                            更多企业解决方案
                                        </div>
                                        <div class="tw-mt-2 tw-text-gray-600" style="font-size:12px;line-height:12px;">
                                            在线笔面试、雇主品牌宣传
                                        </div>
                                    </div> <span tagtype="span" aria-label="RightToMore"
                                        class="ncicon tw-flex-none  ncicon-bleed"><svg focusable="false"
                                            viewBox="0 0 12 12" fill="currentColor" width="12" height="12">
                                            <defs>
                                                <filter color-interpolation-filters="auto">
                                                    <feColorMatrix in="SourceGraphic"
                                                        values="0 0 0 0 0.647059 0 0 0 0 0.647059 0 0 0 0 0.647059 0 0 0 1.000000 0">
                                                    </feColorMatrix>
                                                </filter>
                                            </defs>
                                            <g fill="none" fill-rule="evenodd">
                                                <path fill="currentColor"
                                                    d="M4.4535.6056a.5273.5273 0 0 1 .7457 0l5.0066 5.0048a.5271.5271 0 0 1 .1527.5215.5248.5248 0 0 1-.1457.249l-5.0132 5.0116a.5273.5273 0 0 1-.7458-.7457l4.6466-4.6472-4.647-4.6482a.5275.5275 0 0 1-.061-.6727z">
                                                </path>
                                            </g>
                                        </svg>
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </template>
                </el-dropdown>
            </div>
            <BaseThemeMode />
            <div v-show="isLogin('show')" class="right">
                <el-button @click="dialogLogin = true" class="loginRegisterBtn">
                    <span>登录 / 注册</span>
                </el-button>
            </div>
            <div v-show="!isLogin('show')">
                <div v-el-drawer-drag-width class="avatar-container">
                    <!-- 点击头像触发抽屉 -->
                    <el-avatar :size="36" :src="user?.avatar" @click="drawerVisible = true" />
                    <!-- 抽屉 -->
                    <el-drawer v-model="drawerVisible" :direction="'rtl'" :size="drawerWidth">
                        <template #header="{ titleId, titleClass }">
                            <h4 :id="titleId" :class="titleClass">个人中心</h4>
                            <span class="header-score">个人信用分：{{ user?.score }} 分</span>
                        </template>
                        <!-- 抽屉内容 -->
                        <div class="drawer-info">
                            <div class="drawer-info-left">
                                <el-avatar :size="100" :src="user?.avatar" />
                            </div>
                            <div class="drawer-info-right">
                                <div class="drawer-info-name">
                                    捶友昵称：
                                    <span class="drawer-nickname">
                                        {{ user?.nickname }}
                                    </span>
                                </div>
                                <div class="drawer-info-signature">
                                    签名：
                                    <span class="drawer-signature">
                                        {{ user?.signature }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="drawer-main">
                            <div class="slip-menu">
                                <el-menu text-color="var(--el-menu-text-color)" :ellipsis="false" mode="horizontal"
                                    :default-active="'1'" class="el-menu-vertical-demo" @select="handleSelect">
                                    <el-menu-item @click="drawerMenuType = 'collect'" index="1">
                                        收藏：{{ user.collect_count }}
                                    </el-menu-item>
                                    <el-menu-item @click.="drawerMenuType = 'publish'" index="2">
                                        发布：{{ user.publish_count }}
                                    </el-menu-item>
                                    <el-menu-item @click="drawerMenuType = 'message'" index="3">
                                        消息
                                    </el-menu-item>
                                </el-menu>
                            </div>
                            <div class="menu-content">
                                <div v-show="drawerMenuType === 'collect'">收藏</div>
                                <div v-show="drawerMenuType === 'publish'">发布</div>
                                <div v-show="drawerMenuType === 'message'">消息</div>
                            </div>
                        </div>
                        <div class="drawer-footer">
                            <div class="top-content">
                                <el-button type="info" class="drawer-setting">
                                    <el-icon :size="16" class="setting-icon">
                                        <Setting />
                                    </el-icon>
                                    <span class="setting-text">
                                        设置
                                    </span>
                                </el-button>
                                <el-button @click="Logout" class="logout-btn" type="success">退出登录</el-button>
                            </div>
                            <div class="bottom-dailyImage">
                                <img :src="dailyImage" alt="广告位" />
                            </div>
                        </div>
                    </el-drawer>
                </div>
            </div>
            <el-dialog v-model="dialogLogin" @close="dialogLogin = false;" class="login-dialog" width="700px"
                :before-close="handleClose">
                <div>
                    <div class="login-top">
                        <div @click="dialogType = false" :class="dialogType ? '' : 'active'"
                            class="content job-content">
                            <img src="https://static.nowcoder.com/fe/file/oss/1689329076959EQVSW.png" alt="求职者">我是求职者
                        </div>
                        <img @click="dialogType = false" :src="dialogType ? 'https://static.nowcoder.com/fe/file/oss/1688615753578AHSOY.png'
                            : 'https://static.nowcoder.com/fe/file/oss/1688615533943XCPPM.png'" alt="我是求职者"
                            :class="dialogType ? '' : 'active'" class="job">
                        <div @click="dialogType = true" :class="dialogType ? 'active' : ''"
                            class="recruit-content content">
                            <img src="https://static.nowcoder.com/fe/file/oss/1689329036834EOKNP.png" alt="招聘者">我是招聘方
                        </div>
                        <img @click="dialogType = true" :src="!dialogType ? 'https://static.nowcoder.com/fe/file/oss/1688615753578AHSOY.png'
                            : 'https://static.nowcoder.com/fe/file/oss/1688615782322IEGPA.png'" alt="我是求职者"
                            :class="dialogType ? 'active' : ''" class="not-job">
                    </div>
                    <div class="login-container">
                        <div class="login-main">
                            <div class="form-container">
                                <div class="sparta-login-form">
                                    <div class="sparta-login-form-tabs">
                                        <ul class="sparta-login-form-tab-list">
                                            <li @click="dialogLoginType = false"
                                                :class="!dialogLoginType ? 'active' : ''"
                                                class="sparta-login-form-tab-item sparta-login-form-tab-item-cus">
                                                注册登录
                                                <div v-show="!dialogLoginType"
                                                    class="sparta-login-form-tab-active-bottom">
                                                </div>
                                            </li>
                                            <li @click="dialogLoginType = true" :class="dialogLoginType ? 'active' : ''"
                                                class="sparta-login-form-tab-item sparta-login-form-tab-item-cus">
                                                密码登录
                                                <div v-show="dialogLoginType"
                                                    class="sparta-login-form-tab-active-bottom">
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <el-form v-show="!dialogLoginType" ref="refForm" :model="refPhoneLogin"
                                        :rules="rulePhone">
                                        <el-form-item prop="mobile">
                                            <el-input type="tel" class="el-input-group" v-model="refPhoneLogin.mobile"
                                                placeholder="请输入手机号">
                                            </el-input>
                                            <el-button class="form-code-btn" @click="handleCodeBtn($event)">
                                                {{ handleTime > 60 ? '点击发送' : handleTime + 's' }}
                                            </el-button>
                                        </el-form-item>
                                        <el-form-item prop="code">
                                            <el-input v-model="refPhoneLogin.code" placeholder="请输入验证码"></el-input>
                                        </el-form-item>
                                        <el-button @click="handleLoginAndRegisterBtn" class="form-btn">注册/登录</el-button>
                                        <div class="sparta-login-form-footer">
                                            <el-checkbox v-model="checked" style="margin-right: 4px;" tabindex="0">
                                            </el-checkbox>
                                            同意
                                            <a href="#" target="_blank">《注册协议》</a>
                                            和
                                            <a href="#" target="_blank">《隐私政策》</a>
                                            <div>未注册手机验证后自动登录</div>
                                        </div>
                                    </el-form>
                                    <el-form v-show="dialogLoginType" ref="refFormEmail" :model="refEmailLogin"
                                        :rules="ruleEmail">
                                        <el-form-item prop="key">
                                            <el-input class="el-input-email" v-model="refEmailLogin.key"
                                                placeholder="请输入邮箱/手机号">
                                            </el-input>
                                        </el-form-item>
                                        <el-form-item prop="password">
                                            <el-input v-model="refEmailLogin.password" placeholder="请输入密码"></el-input>
                                        </el-form-item>
                                        <el-button @click="handleLoginBtn" class="form-btn"
                                            type="primary">登录</el-button>
                                    </el-form>
                                </div>
                            </div>
                        </div>
                        <div class="split">
                            <div class="split-line"></div> <span class="split-text">or</span>
                            <div class="split-line"></div>
                        </div>
                        <div class="login-right">
                            <div class="right-scancode">扫码登录</div>
                            <img src="@/assets/img/image.png" alt="扫码">
                        </div>
                    </div>
                </div>
            </el-dialog>
        </nav>
    </header>
</template>

<style scoped>
.nav-header {
    background-color: var(--el-bg-color);
    box-shadow: 0 0 0 0 transparent, 0 0 0 0 transparent, 0 1px 4px 0 rgba(0, 0, 0, .02), 0 2px 12px 0 rgba(0, 0, 0, .04), 0 2px 6px 0 rgba(0, 0, 0, .02);
    height: 56px;
    left: 0;
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 101;
    min-width: 1200px;
}

.nav-header nav {
    align-items: center;
    justify-content: center;
    display: flex;
    height: 100%;
    margin: 0 100px;
}

.nav-header .logo {
    align-items: center;
    display: flex;
    flex-shrink: 0;
}

.nav-header .logo img {
    height: 40px;
}

.nav-header a {
    color: inherit;
    text-decoration: none;
}

.nav-header-menu {
    align-items: center;
    display: flex;
    height: 100%;
    margin-right: 32px;
}

.nav-header-menu .nav-header-menuitem {
    color: var(--el-menu-text-color);
    cursor: pointer;
    flex-shrink: 0;
    font-size: 16px;
    height: 100%;
    padding: 0 12px;
    position: relative;
    transition: all .2s ease;
}

.nav-header-menu .head-title,
.nav-header-menu .nav-header-menuitem a {
    align-items: center;
    display: flex;
    height: 100%;
}

.hover-class:hover {
    color: #00ce95;
}

.nav-header-menu:active {
    color: var(--project_base_color);
}

.nav-header-menu .line {
    background-color: var(--project_base_color);
    border-top-right-radius: 2px;
    bottom: 8px;
    height: 4px;
    left: 50%;
    margin-left: -6px;
    padding: 0;
    position: absolute;
    width: 12px;
}

.nav-header-search {
    align-items: center;
    display: flex;
    height: 100%;
    position: relative;
}

@media only screen and (max-width: 1024px) {
    :deep(.nav-header-search .el-input) {
        width: 333px;
    }

    .nav-header-menu {
        margin-right: 32px;
    }
}

@media only screen and (min-width: 1537px) {
    :deep(.nav-header-search .el-input) {
        width: 500px;
    }

    .nav-header-menu {
        margin-right: 144px;
    }
}


@media only screen and (min-width: 1025px) and (max-width: 1536px) {
    :deep(.nav-header-search .el-input) {
        width: 400px;
    }

    .nav-header-menu {
        margin-right: 72px;
    }
}



:deep(.nav-header-search .el-input .el-input__wrapper) {
    box-shadow: none;
}

:deep(.nav-header-search .el-input .el-input__inner) {
    -webkit-appearance: none;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    color: #333;
    display: inline-block;
    font-size: inherit;
    height: 32px;
    line-height: 32px;
    outline: 0;
    padding: 0 12px;
    transition: border-color .2s cubic-bezier(.645, .045, .355, 1);
    width: 100%;
}

:deep(.nav-header-search .el-input .el-input__inner) {
    background-color: #f8f8f8;
    border-color: #f8f8f8;
    color: #303133;
    height: 36px;
}

:deep(.el-input__suffix) {
    color: #999;
    height: 100%;
    pointer-events: none;
    position: absolute;
    right: 5px;
    text-align: center;
    top: 0;
    transition: all .3s;
}

.nav-header-search .cus-search-suffix {
    align-items: center;
    color: var(--project_base_color);
    cursor: pointer;
    display: flex;
    height: 100%;
    padding-right: 12px;
}

.nav-header-search .cus-search-suffix:hover {
    color: var(--project_base_color_hover);
}

.nav-header-search .cus-search-suffix .search-suffix-vertical {
    background: var(--el-fill-color);
    border-radius: 8px;
    box-shadow: 4px 3px 12px 0 rgba(0, 0, 0, .05);
    height: 20px;
    margin-right: 12px;
    width: 1px;
}

.ncicon.ncicon-bleed {
    vertical-align: -.15em;
}

.ncicon {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    display: inline-block;
    font-style: normal;
    line-height: 0;
    text-align: center;
    text-rendering: optimizeLegibility;
    text-transform: none;
    vertical-align: -.125em;
}

.ncicon svg {
    display: inline-block;
}

.ncicon>* {
    line-height: 1;
}

.ncicon .ncicon-bleed {
    vertical-align: -.15em;
}

.header-publish-job-wrap .recruit {
    background: var(--el-fill-color);
    border-radius: 8px;
    color: var(--project_base_color);
    font-size: 14px;
    height: 34px;
    line-height: 34px;
    padding: 0 10px;
    text-align: center;
}

.header-publish-job-wrap .recruit:hover {
    background: #eefaf7;
}

:deep(.el-dropdown) {
    color: #333;
    display: inline-block;
    font-size: 14px;
    position: relative;
}

.dropdown-item-more-solution,
.dropdown-item-publish-job {
    padding: 8px 12px;
}

.dropdown-item-more-solution a,
.dropdown-item-publish-job a {
    color: var(--el-menu-text-color);
}

.dropdown-item-more-solution a:hover,
.dropdown-item-publish-job a:hover {
    color: var(--project_base_color_hover);
}

.nav-header .right {
    align-items: center;
    display: flex;
}

.loginRegisterBtn {
    border-radius: 8px;
    background: linear-gradient(135deg, #00dcc2, #00dc93) !important;
    border: none !important;
    box-shadow: 4px 3px 12px 0 rgba(0, 0, 0, .05) !important;
    padding: 10px 0 !important;
    color: #fff;
    font-family: revert;
    font-size: 14px;
    text-align: center;
    width: 95px;
}

.loginRegisterBtn:hover {
    background: linear-gradient(135deg, #00c5ac, #00c585) !important;
    color: #fff;
}

:deep(.el-drawer__header) {
    margin-bottom: 10px;
}

/* 头像抽屉样式 */
nav .avatar-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 20px;
}

nav .avatar-container .el-avatar:hover {
    transform: rotate(666turn);
    transition: all 59s cubic-bezier(.34, 0, .84, 1) 1s;
}

.avatar-container .header-score {
    color: #666;
    font-size: 14px;
    margin-right: 20px;
}

.avatar-container .drawer-info {
    display: flex;
    font-size: 16px;
    color: #00c585;
    line-height: 1.5;
    font-family: 'Roboto', sans-serif;
}

.avatar-container .drawer-info .drawer-info-left,
.avatar-container .drawer-info .drawer-info-right {
    margin-right: 20px;
}

.avatar-container .drawer-info .drawer-info-right .drawer-nickname,
.avatar-container .drawer-info .drawer-info-right .drawer-signature {
    font-size: 14px;
    color: #666;
    text-decoration: underline;
}

.avatar-container .drawer-info .drawer-info-right .drawer-info-name {
    margin-bottom: 5px;
}

.avatar-container .drawer-main {
    border: 1px solid var(--el-fill-color);
    background-color: var(--el-bg-color);
    border-radius: 3%;
    height: calc(70% - 105px);
    /* 固定高度 */
    overflow: auto;
    /* 内容超出时显示滚动条 */
    margin-top: 3px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.avatar-container .drawer-main .slip-menu {
    overflow: hidden;
    user-select: none;
}

.avatar-container .drawer-main .slip-menu .el-menu--horizontal {
    height: 40px !important;
}


.el-menu--horizontal>.el-menu-item:hover {
    background-color: var(--project_base_color_hover) !important;
}

.el-menu--horizontal>.el-menu-item:focus {
    background-color: var(--el-fill-color) !important;
}

.el-menu--horizontal>.el-menu-item.is-active {
    color: var(--project_base_color) !important;
    border-bottom: 2px solid var(--project_base_color) !important;
}

.el-menu--horizontal>.el-menu-item.is-active:hover {
    background-color: var(--project_base_color_hover);
}

nav .avatar-container .drawer-footer {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 72%;
}

nav .avatar-container .drawer-footer .top-content {
    display: flex;
    justify-content: flex-end;
    position: relative;
    left: -40px;
    margin: 5px 0;
}

nav .avatar-container .drawer-footer .drawer-setting {
    width: 34px;
    height: 34px;
}

nav .avatar-container .drawer-footer .drawer-setting:hover {
    width: 68px;
    height: 34px;
    transition: width 0.5s ease;
}

.setting-text {
    display: none;
    /* 初始状态下文字不可见 */
    transition: opacity 0.3s ease;
    /* 文字透明度变化的过渡效果 */
}

.drawer-setting:hover .setting-text {
    display: block;
    /* 悬停时文字可见 */
}

nav .avatar-container .drawer-footer .logout-btn {
    width: 100px;
    background: linear-gradient(135deg, #00dcc2, #00dc93) !important;
    border: none !important;
    box-shadow: 4px 3px 12px 0 rgba(0, 0, 0, .05) !important;
    color: #fff;
    font-family: revert;
    font-size: 14px;
    text-align: center;
    margin-left: 30px;
}

.avatar-container .drawer-footer .bottom-dailyImage {
    margin-right: 40px;
    height: 22%;
}

.avatar-container .drawer-footer .bottom-dailyImage img {
    border-radius: 5%;
    width: 100%;
    height: 100%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.avatar-container .drawer-footer .bottom-dailyImage img:hover {
    filter: brightness(0.9);
    cursor: pointer;
}

/* 登录注册弹窗样式 */
:deep(.el-dialog) {
    padding: 0%;
}

.el-dialog .el-dialog__header {
    padding-bottom: 8px;
}

:deep(.login-dialog .el-dialog__header) {
    height: 0;
    padding: 0;
}

:deep(.login-dialog .el-dialog__headerbtn) {
    font-size: 20px;
    right: 5px;
    top: 5px;
    z-index: 999;
}

:deep(.el-dialog__title) {
    color: #333;
    display: inline-block;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
}

.login-top {
    display: flex;
    height: 60px;
    position: relative;
}

.login-top img {
    cursor: pointer;
    flex: 1;
}

.login-top .content.active {
    -webkit-text-fill-color: transparent;
    background: linear-gradient(135deg, #00dcc2, #00dc93);
    -webkit-background-clip: text;
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
}

.login-top .job-content {
    left: 113px;
}

.login-top .content {
    -webkit-text-fill-color: transparent;
    background: linear-gradient(135deg, #00dcc2, #00dc93);
    -webkit-background-clip: text;
    color: var(--project_base_color);
    cursor: pointer;
    font-size: 18px;
    font-weight: 400;
    line-height: 22px;
    position: absolute;
    top: 16px;
    z-index: 10;
}

.login-top .content img {
    height: 32px;
    margin-right: 4px;
    vertical-align: text-bottom;
    width: 32px;
    z-index: -1;
}

.login-top img.active {
    margin-top: -8px;
    z-index: 2;
}

.login-top .recruit-content {
    left: 460px;
}

.login-top .not-job {
    margin-left: -80px;
}

.login-container {
    display: flex;
    padding-top: 40px;
}

.login-container .login-main {
    box-sizing: border-box;
    padding: 0 40px 30px;
    width: 390px;
}

.login-container .login-main .form-container {
    width: 100%;
}

.sparta-login-form-tabs {
    margin-bottom: 32px;
}

.sparta-login-form-tabs .sparta-login-form-tab-list {
    background-color: inherit;
    border-radius: 4px;
    color: #303133;
    cursor: pointer;
    display: inline-block;
    font-size: 14px;
    padding: 2px;
    position: relative;
}

.sparta-login-form-tabs li,
.sparta-login-form-tabs ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.sparta-login-form-tabs .sparta-login-form-tab-list .sparta-login-form-tab-item.active {
    color: #333;
}

.sparta-login-form-tabs .sparta-login-form-tab-list .sparta-login-form-tab-item {
    color: #999;
    display: inline-block;
    font-size: 18px;
    font-weight: 500;
    height: 24px;
    line-height: 24px;
    margin-right: 24px;
    position: relative;
}

.sparta-login-form-tabs li,
.sparta-login-form-tabs ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.sparta-login-form-tabs .sparta-login-form-tab-list .sparta-login-form-tab-active-bottom {
    background: linear-gradient(135deg, #00dcc2, #00dc93);
    border-radius: 0px;
    height: 4px;
    width: 72px;
}

:deep(.sparta-login-form .el-form .el-form-item .el-form-item__content) {
    height: 40px;
}

:deep(.el-form-item__content) {
    font-size: 14px;
    line-height: 40px;
    position: relative;
    margin-top: 10px;
}

:deep(.el-form-item__content .el-input-group) {
    width: 75%;
}

:deep(.el-form-item__content .el-input-email) {
    width: 100%;
}

:deep(.sparta-login-form .el-form .el-form-item .el-form-item__content .el-input input,
    .sparta-login-form .el-form .el-form-item .el-input__inner) {
    height: 40px;
    width: 100%;
}

.login-container .form-container .form-code-btn {
    background: linear-gradient(135deg, #00dcc2, #00dc93);
    border: none !important;
    color: #fff;
    font-family: revert;
    font-size: 14px;
    text-align: center;
    height: 40px;
    width: 25%;
    border-radius: 0%;
}

.login-container .form-container .form-btn {
    background: linear-gradient(135deg, #00dcc2, #00dc93);
    border: none;
    border-radius: 0;
    color: #fff;
    font-size: 14px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    width: 100%;
    margin-top: 10px;
}

.login-container .form-btn:hover {
    background: linear-gradient(135deg, #00dcc2, #00dc93);
}

.sparta-login-form-footer {
    font-size: 12px;
    line-height: 1.5;
    margin-top: 12px;
    text-align: center;
}

.sparta-login-form-footer a {
    color: #00dcc2;
}

.split {
    align-items: center;
    display: flex;
    flex-direction: column;
    width: 15px;
}

.split .split-line {
    background-color: #f0f0f0;
    height: 100px;
    width: 1px;
}

.split .split-text {
    color: #bbb;
    font-size: 12px;
    line-height: 12px;
    padding-bottom: 12px;
    padding-top: 12px;
}

.split .split-line {
    background-color: #f0f0f0;
    height: 100px;
    width: 1px;
}

.login-container .login-right {
    width: 309px;
}

.login-container .login-right .right-scancode {
    color: #333;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    text-align: center;
}

.login-container .login-right img {
    margin-left: 20px;
}
</style>