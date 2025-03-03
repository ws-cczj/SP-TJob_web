<script lang="ts" setup>
import type { ElScrollbar, FormInstance, FormRules, ScrollbarInstance } from 'element-plus'
import { getCurrentInstance, nextTick, ref, shallowRef, unref, watch } from 'vue'
import { smsSend, login, register, updateInfo, closeSession, createSession, searchUser, getSessions, updateSessionTopic, getFeedCollect, getFeedPublishPost } from '../gateway/api'
import { alertBox, confirmBox, errorMsg, infoMsg, successMsg, warnMsg } from '../utils/message/message'
import { clearStorage, getStorageFromKey, setStorage } from '../utils/storage/config'
import { Log } from '../utils/log/log'
import type { UserResp } from '../gateway/interface/userResp'
import type { MessageResp, SessionResp } from '../gateway/interface/messageResp'
import type { PostResp } from '../gateway/interface/postResp'
import hasPermission from '../utils/permission/permission'
import CCZJWebSocket from '../utils/websocket'
import store from '../store'
import { getTimeNow } from '../utils/time'

// ------------------- 父子通信区 -------------------
const { proxy } = getCurrentInstance() as any
const router = proxy.$router
const user = shallowRef(getStorageFromKey('cczj_user') as UserResp || store.data.user)
// 登陆弹窗
const dialogLogin = shallowRef<boolean>(false)
// 搜索内容
const searchInput = shallowRef<string>('')
// 弹窗类型
const dialogType = shallowRef<boolean>(false)
// 弹窗登录类型
const dialogLoginType = shallowRef<boolean>(false)
// 处理倒计时
const handleTime = shallowRef<number>(61)
// 复选框
const checked = shallowRef<boolean>(false)
const refForm = ref<FormInstance | null>(null)
const refFormEmail = ref<FormInstance | null>(null)
const refPhoneLogin = ref({
  mobile: '',
  code: ''
})
const refEmailLogin = ref({
  key: '16639528057',
  password: '123456'
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
  url: '/'
}, {
  id: 2,
  name: '友圈',
  url: 'talk'
}, {
  id: 3,
  name: '消息',
  url: 'message'
}
])
// 消息窗口
const dialogMessage = shallowRef(false)
// 是否消息窗口全屏
const isFull = shallowRef(false)
const handleNav = (signal: string) => {
  if (signal === 'message') {
    dialogMessage.value = true
    createWebsocket()
  } else if (signal === 'talk') {
    todo()
  } else if (signal === '/') {
    router.push('/')
  }
}

const messageScrollBar = ref<ScrollbarInstance>()
// 滚动到底部的实现
const scrollToBottom = () => {
  nextTick(() => {
    if (messageScrollBar.value) {
      messageScrollBar.value!.setScrollTop(messageScrollBar.value.wrapRef!.scrollHeight)
    }
  })
}
const ws = shallowRef<CCZJWebSocket | null>(null)
const createWebsocket = () => {
  const token = getStorageFromKey('cczj_token')
  if (token) {
    feedSessions()
    ws.value = new CCZJWebSocket(token)
    ws.value.recive<MessageResp>(async (data: MessageResp) => {
      Log.info('components', '收到消息', data)
      if (activeSession.value) {
        const dUid = parseInt(data.user_id)
        const dTUid = parseInt(data.target_id)
        const aUid = parseInt(activeSession.value.user_id)
        const aTUid = parseInt(activeSession.value.target_id)
        // 先判断是不是当前消息 对方发来的
        if (dUid === aTUid && dTUid === aUid) {
          activeSession.value.messages.push(data)
          return;
        }
        // 在判断是不是自己发的消息, 然后返回的状态信息
        if (dTUid === aTUid && dUid === aUid) {
          activeSession.value.messages[activeSession.value.messages.length - 1] = data
          return;
        } else {
          // 如果不是状态信息 判断是不是当前会话里的某个消息
          var flag = false
          sessions.value.forEach((session) => {
            if (dUid === parseInt(session.target_id)
              && dTUid === parseInt(session.user_id)) {
              session.messages.push(data)
              flag = true
              return;
            }
          })
          if (!flag) {
            // 如果不是当前消息，需要更新未读消息
            const data2 = await createSession(data.user_id)
            if (!data2) {
              Log.error('components', '创建会话失败')
              errorMsg('创建会话失败，请联系管理员')
              return
            }
            successMsg('收到新消息')
            Log.info('components', '创建会话成功')
            setStorage('cczj_token', data2.token)
            sessions.value.push(data2.session)
          }
        }
      }
    })
  } else {
    dialogLogin.value = true
    store.data.setDialogLogin(true)
    warnMsg('请先登录')
  }
}

// handleCloseWebsocket 关闭websocket窗口
const handleCloseWebsocket = () => {
  dialogMessage.value = false
  if (ws.value) {
    ws.value.close()
  }
}
const activeSession = ref<SessionResp>();
const sessions = ref<SessionResp[]>([])
const feedSessions = async () => {
  const data = await getSessions()
  if (!data) {
    Log.error('components', '获取会话列表失败')
    errorMsg('获取会话列表失败，请联系管理员')
    return
  }
  Log.info('components', '获取会话列表成功', data)
  setStorage('cczj_token', data.token)
  sessions.value = data.sessions
  dialogUsers.value = data.users
  dialogUsersCount.value = data.users.length
  if (sessions.value.length > 0) {
    activeSession.value = sessions.value[0]
    sessionTopic.value = activeSession.value.topic
  }
}

const sessionTopic = shallowRef('新的会话')
const topicOnlyRead = shallowRef(true)
// handleEditSession 编辑会话
const handleEditSession = async (id: number | undefined) => {
  if (typeof id === 'undefined' || topicOnlyRead.value) return;
  const content = sessionTopic.value.trim()
  if (content === '') {
    warnMsg('请输入会话主题')
    return
  }
  if (content === activeSession.value?.topic) {
    topicOnlyRead.value = true
    return
  };
  const data = await updateSessionTopic({ 'id': id, 'topic': content })
  if (!data) {
    Log.error('components', '编辑会话失败')
    errorMsg('编辑会话失败，请联系管理员')
    topicOnlyRead.value = true
    return
  }
  Log.info('components', '编辑会话成功', data)
  setStorage('cczj_token', data.token)
  sessions.value.forEach((session) => {
    if (session.id === id) {
      session.topic = unref(sessionTopic)
      activeSession.value = session
      return;
    }
  })
  topicOnlyRead.value = true
}
// 关闭会话窗口
const handleCloseSession = async (id: number) => {
  const data = await closeSession(id)
  if (!data) {
    Log.error('components', '关闭会话失败')
    errorMsg('删除会话失败，请联系管理员')
    return
  }
  Log.info('components', '关闭会话成功')
  setStorage('cczj_token', data.token)
  sessions.value = sessions.value.filter((session) => session.id !== id)
  if (sessions.value.length > 0) {
    handleSessionSwitch(sessions.value[0])
  } else {
    activeSession.value = undefined
  }
}

// handleCreateSession 创建新会话
const handleCreateSession = async (targetId: string) => {
  const data = await createSession(targetId)
  if (!data) {
    Log.error('components', '创建会话失败')
    errorMsg('创建会话失败，请联系管理员')
    return
  }
  Log.info('components', '创建会话成功')
  setStorage('cczj_token', data.token)
  sessions.value.push(data.session)
  handleSessionSwitch(data.session)
  dialogSearchUser.value = false
}

// 消息发送
const messageContent = shallowRef('')
const sendMessage = () => {
  if (!ws.value) {
    warnMsg('请重新打开消息窗口')
    return
  }
  const content = messageContent.value.trim()
  if (content === '') {
    warnMsg('请输入消息内容')
    return
  }
  if (activeSession.value) {
    ws.value.send<MessageResp>({
      id: '0',
      content: content,
      user_id: user.value.user_id.toString(),
      target_id: activeSession.value.target_id.toString(),
      status: 0,
      create_at: getTimeNow()
    })
    activeSession.value.messages.push({
      id: '0',
      content: content,
      user_id: user.value.user_id.toString(),
      target_id: activeSession.value.target_id.toString(),
      status: 0,
      create_at: getTimeNow()
    })
    // 滚动至最底部
    scrollToBottom()
    messageContent.value = ''
  }
}

// 会话切换
const handleSessionSwitch = (session: SessionResp) => {
  activeSession.value = session
  sessionTopic.value = session.topic
}

const dialogSearchUser = shallowRef(false)
const dialogSearchInput = shallowRef<string>('')
const dialogPage = shallowRef<number>(1)
const dialogUsersCount = shallowRef(0)
const dialogUsers = ref<UserResp[]>([])
const handleSearchUser = async () => {
  const nickname = unref(dialogSearchInput).trim()
  if (nickname === '') {
    warnMsg('请输入搜索用户昵称')
    return
  }
  const data = await searchUser(dialogPage.value, nickname)
  if (!data) {
    Log.error('components', '搜索用户失败')
    errorMsg('搜索用户失败，请联系管理员')
    return
  }
  if (data.count === 0) {
    successMsg('没有搜索到用户')
    return
  }
  dialogPage.value++
  dialogUsers.value.push(...data.users)
  dialogUsersCount.value = data.count
  Log.info('components', '搜索用户成功', data.users)
  setStorage('cczj_token', data.token)
}

// 控制头像抽屉的显示与隐藏
const drawerVisible = shallowRef(false);
const innerDrawer = shallowRef(false);
const drawerMenuType = shallowRef('collect');
const drawerMenuList = shallowRef<PostResp[]>([])
const adminSecret = shallowRef('')
const handleDrawerMenu = async (type: string) => {
  if (type === 'collect') {
    adminSecret.value += '1'
    const data = await getFeedCollect()
    if (!data) {
      Log.error('components', '获取收藏列表失败')
      errorMsg('获取收藏列表失败，请联系管理员')
      return
    }
    Log.info('components', '获取收藏列表成功', data)
    drawerMenuList.value = data.posts
    setStorage('cczj_token', data.token)
  } else if (type === 'publish') {
    adminSecret.value += '2'
    const data = await getFeedPublishPost()
    if (!data) {
      Log.error('components', '获取发布列表失败')
      errorMsg('获取发布列表失败，请联系管理员')
      return
    }
    Log.info('components', '获取发布列表成功', data)
    drawerMenuList.value = data.posts
    setStorage('cczj_token', data.token)
  }
  drawerMenuType.value = type
}
handleDrawerMenu('collect')
// 跳转到详情页
const handleToDeatails = (postId: number) => {
  window.open(router.resolve({ name: 'details', params: { postId: postId } }).href, '_blank')
}
const dailyImage = shallowRef('https://img-baofun.zhhainiao.com/fs/7f66bf9152c32f79205ca3a77a5af6df.jpg')
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
  return url === '/'
}
// 搜索建议回调函数
const querySearchAsync = () => { }
// 点击建议时触发
const drawerWidth = shallowRef<number>(store.data.drawerWidth || 400)
// 组件 v-el-drawer-drag-width 的回调函数
const handleWidthChange = (width: number) => {
  drawerWidth.value = width
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
  const data = await smsSend(refPhoneLogin.value.mobile)
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
      const data = await register(refPhoneLogin.value)
      if (!data) {
        Log.error('components/BaseHeaderComponent', '注册失败', data)
        return
      }
      setStorage('cczj_token', data.token)
      setStorage('cczj_user', data.user)
      user.value = data.user
      Log.info('components/BaseHeaderComponent', '注册成功', data)
      dialogLogin.value = false
      window.location.reload()
    }
  })
}
// 登陆处理
const handleLoginBtn = () => {
  refFormEmail.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 登录注册处理
      const data = await login(refEmailLogin.value)
      if (!data) {
        Log.error('components/BaseHeaderComponent', '登录失败', data)
        return
      }
      setStorage('cczj_token', data.token)
      setStorage('cczj_user', data.user)
      user.value = data.user
      dialogLogin.value = false
      window.location.reload()
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
    store.data.setDialogLogin(true)
  } else {
    window.open(router.resolve(`/post/${user.value.user_id}`).href, '_blank')
  }
  return true
}
// 设置
const ruleFormRef = ref<FormInstance | null>(null)
const ruleForm = ref<UserResp>({
  id: user.value.id,
  user_id: user.value.user_id,
  bean: user.value.bean,
  role: user.value.role,
  collect_count: user.value.collect_count,
  publish_count: user.value.publish_count,
  nickname: user.value.nickname,
  password: user.value.password,
  gender: user.value.gender,
  mobile: user.value.mobile,
  avatar: user.value.avatar,
  email: user.value.email,
  signature: user.value.signature
})
const rules = ref({
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 32, message: '长度在 2 到 32 个字符', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (getStorageFromKey('cczj_nickname')) {
          warnMsg('30天内不可以重复修改昵称')
          callback(new Error('30天内不可以重复修改昵称'))
        } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
          callback(new Error('昵称只能包含中文、英文、数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '请输入6-20位的密码', trigger: 'blur' }
  ],
  email: [
    { pattern: /^(?=.{11,11}$)\d+|.*@.*/, message: '请输入正确邮箱地址', trigger: 'blur' }
  ],
})

// 个人信息提交
const settingBtn = () => {
  const withNickname = user.value.nickname !== ruleForm.value.nickname
  const then = () => {
    ruleFormRef.value?.validate(async (valid: boolean) => {
      if (valid) {
        // 设置处理
        const data = await updateInfo(ruleForm.value)
        if (!data) {
          Log.error('components/BaseHeaderComponent', '设置失败', data)
          return
        }
        if (withNickname) {
          setStorage('cczj_nickname', ruleForm.value.nickname)
        }
        setStorage('cczj_user', ruleForm.value)
        setStorage('cczj_token', data.token)
        user.value = ruleForm.value
        Log.info('components/BaseHeaderComponent', '设置成功', ruleForm.value)
        innerDrawer.value = false
      }
    })
  }
  // 只有修改名字才会提示
  if (withNickname) {
    confirmBox('确定提交吗? 昵称30天内只能修改一次噢！', '提交', '确定', '取消').then(then).catch(() => { })
  } else {
    then()
  }
}

// 登录管理页面
const LoginAdmin = () => {
  if (adminSecret.value !== '1221') {
    warnMsg('请输入管理员密钥')
    Log.warning('components/BaseHeaderComponent', '管理员机制触发: ', adminSecret.value)
    adminSecret.value = ''
    return
  }
  if (!hasPermission(user.value.role.permission, 'admin')) {
    // TODO 报警发送消息给管理员
    console.log('没有权限')
    return;
  }
  Log.info('components/BaseHeaderComponent', '进入管理页面: ', user.value.user_id)
  router.push('/admin')
}
// 退出登录
const Logout = () => {
  confirmBox('确定退出登录吗？', '退出登录', '退出', '取消').then(() => {
    if (getStorageFromKey('cczj_nickname')) {
      clearStorage()
      setStorage('cczj_nickname', user.value.nickname)
    } else {
      clearStorage()
    }
    window.location.reload()
  }).catch(() => { });
}
// 处理取消弹窗
const handleCancelDialog = (dialog: boolean) => {
  dialogLogin.value = dialog
  store.data.setDialogLogin(dialog)
}
const todo = () => {
  warnMsg('功能开发中...')
}
watch(() => store.data.dialogLogin, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    dialogLogin.value = newVal!
  }
})
watch(() => store.data.dialogSessionId, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (newVal && !ws.value) {
      dialogMessage.value = true
      createWebsocket()
      createSession(newVal)
    }
  }
})
</script>

<template>
  <header class="nav-header">
    <nav>
      <a @click="handleNav('/')" href="#" target="_self" class="logo" style="width:100px;">
        <img src="@/assets/img/cczj_blue_logo.png" alt="logo" />
      </a>
      <ul class="nav-header-menu">
        <li v-for="nav in navs" :key="nav.id" class="hover-class nav-header-menuitem">
          <a id="nav-home" @click.stop="handleNav(nav.url)" target="_self"
            class="hover-class nc-nav-header-menu-active">{{
              nav.name }}</a>
          <div class="line" v-show="judgePath(nav.url)" />
        </li>
      </ul>
      <div class="nav-header-search">
        <el-autocomplete v-model="searchInput" :trigger-on-focus="false" :fetch-suggestions="querySearchAsync"
          placeholder="搜索题目">
          <template #suffix>
            <div class="cus-search-suffix">
              <div class="search-suffix-vertical"></div>
              <span tagtype="span" class="ncicon  ncicon-bleed" style="margin-right:4px;"><svg focusable="false"
                  viewBox="0 0 1024 1024" fill="currentColor" width="16" height="16">
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
              <span @click="todo()">搜索</span>
            </div>
          </template>
        </el-autocomplete>
      </div>
      <div class="header-publish-job-wrap cczj-mx-5">
        <el-dropdown placement="bottom-start">
          <a @click="isLogin('click')"
            class="recruit cczj-flex cczj-items-center cczj-cursor-pointer el-dropdown-selfdefine"
            href="javascript:void(0)">
            广开言路
            <svg viewBox="0 0 1024 1024" fill="currentColor" width="14" height="14">
              <path fill="currentColor" fill-rule="nonzero"
                d="M828.0447 281.2004c17.5625-19.8576 47.8974-21.7181 67.755-4.1557 19.659 17.3869 21.679 47.292 4.6766 67.1561l-.521.5988L571.9255 715.697c-29.2708 33.096-79.829 36.1968-112.925 6.926a80 80 0 0 1-6.1988-6.115l-.7272-.811-328.0298-370.8974c-17.5624-19.8575-15.7019-50.1924 4.1557-67.7549 19.659-17.3868 49.5868-15.7372 67.2242 3.5653l.5307.5904L511.999 638.545l316.0457-357.3446z">
              </path>
            </svg>
          </a>
          <template #dropdown>
            <ul>
              <li tabindex="-1" class="dropdown-item-publish-job">
                <a @click="isLogin('click')" href="javascript:void(0)" class="cczj-flex cczj-items-center">
                  <img src="https://static.nowcoder.com/fe/file/images/web/header/headerPublishJob.png"
                    class="cczj-width-38 cczj-mr-2 cczj-flex-none">
                  <div class="cczj-flex-auto">
                    <div style="font-size:16px;line-height:16px;font-weight:500;">
                      三顾茅庐
                    </div>
                    <div class="cczj-mt-2 cczj-text-gray-600" style="font-size:12px;line-height:12px;">
                      发布兼职、邀约干将
                    </div>
                  </div> <span class="ncicon cczj-flex-none  ncicon-bleed"><svg focusable="false" viewBox="0 0 12 12"
                      fill="currentColor" width="12" height="12">
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
              <li tabindex="-1" class="dropdown-item-more-solution cczj-mt-2">
                <a @click="isLogin('click')" href="javascript:void(0)" class="cczj-flex cczj-items-center">
                  <img src="https://static.nowcoder.com/fe/file/images/web/header/headerMoreSolution.png"
                    class="cczj-w-38 cczj-mr-2 cczj-flex-none">
                  <div class="cczj-flex-auto">
                    <div style="font-size:16px;line-height:16px;font-weight:500;">
                      毛遂自荐
                    </div>
                    <div class="cczj-mt-2 cczj-text-gray-600" style="font-size:12px;line-height:12px;">
                      加入我们,开始你的兼职之旅
                    </div>
                  </div> <span tagtype="span" aria-label="RightToMore" class="ncicon cczj-flex-none  ncicon-bleed"><svg
                      focusable="false" viewBox="0 0 12 12" fill="currentColor" width="12" height="12">
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
              <li tabindex="-1" class="dropdown-item-more-solution cczj-mt-2">
                <a @click="isLogin('click')" href="javascript:void(0)" class="cczj-flex cczj-items-center">
                  <svg t="1738983520817" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="1310" width="40" height="40">
                    <path
                      d="M766.293333 757.8624c0.477867 2.3552 0.682667 4.7104 0.682667 7.133867 0 55.432533-125.815467 100.352-281.088 100.352-155.2384 0-281.088-44.919467-281.088-100.352 0-2.389333 0.238933-4.778667 0.682667-7.168A34.269867 34.269867 0 0 1 204.8 750.933333v-132.5056a34.133333 34.133333 0 0 1 34.133333-34.133333h493.909334a34.133333 34.133333 0 0 1 34.133333 34.133333V750.933333c0 2.389333-0.2048 4.676267-0.682667 6.929067z"
                      fill="#1cdfb6" p-id="1311"></path>
                    <path
                      d="M579.584 357.888h153.258667a59.733333 59.733333 0 0 1 57.1392 42.257067 126.020267 126.020267 0 0 1 2.628266 247.296v23.210666c0 1.809067-0.1024 3.652267-0.273066 5.461334 0.170667 2.8672 0.273067 5.700267 0.273066 8.533333 0 116.9408-139.0592 206.336-306.722133 206.336-167.6288 0-306.688-89.3952-306.688-206.301867 0-2.8672 0.068267-5.700267 0.238933-8.533333a60.177067 60.177067 0 0 1-0.238933-5.5296v-252.996267c0-32.9728 26.760533-59.733333 59.733333-59.733333h102.4a25.531733 25.531733 0 0 1 14.2336-14.9504c35.805867-14.984533 49.664-57.1392 17.339734-90.7264-46.421333-48.196267-34.747733-107.588267 26.350933-168.004267a25.6 25.6 0 0 1 36.010667 36.386134c-43.451733 42.973867-49.0496 71.611733-25.463467 96.119466 43.861333 45.568 40.482133 102.980267 9.147733 141.175467h83.012267a25.531733 25.531733 0 0 1 14.199467-14.9504c35.84-14.984533 49.698133-57.1392 17.373866-90.7264-46.421333-48.196267-34.747733-107.588267 26.350934-168.004267a25.6 25.6 0 0 1 36.010666 36.386134c-43.451733 42.973867-49.083733 71.611733-25.463466 96.119466 43.861333 45.568 40.482133 102.980267 9.1136 141.175467z m212.992 236.4416a74.820267 74.820267 0 0 0 0-140.5952v140.629333z m-51.473067 83.182933l0.2048-5.632a8.8064 8.8064 0 0 0 0.1024-1.262933v-252.996267a8.533333 8.533333 0 0 0-8.533333-8.533333H238.933333a8.533333 8.533333 0 0 0-8.533333 8.533333v252.996267c0 0.443733 0 0.853333 0.1024 1.262933l0.170667 5.632c-0.170667 2.389333-0.273067 4.778667-0.273067 7.168 0 82.670933 112.64 155.101867 255.488 155.101867 142.848 0 255.522133-72.430933 255.522133-155.101867 0-2.389333-0.1024-4.778667-0.3072-7.168z"
                      fill="#1cdfb6" p-id="1312"></path>
                  </svg>
                  <div class="cczj-flex-auto">
                    <div style="font-size:16px;line-height:16px;font-weight:500;margin-left: 10px;">
                      畅所欲言
                    </div>
                    <div class="cczj-mt-2 cczj-text-gray-600"
                      style="font-size:12px;line-height:12px;margin-left: 10px;">
                      我们有酒,你有故事吗
                    </div>
                  </div> <span tagtype="span" aria-label="RightToMore" class="ncicon cczj-flex-none  ncicon-bleed">
                    <svg focusable="false" viewBox="0 0 12 12" fill="currentColor" width="12" height="12">
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
      <div v-if="isLogin('show')" class="right">
        <el-button @click="handleCancelDialog(true)" class="loginRegisterBtn">
          <span>登录 / 注册</span>
        </el-button>
      </div>
      <div v-else v-el-drawer-drag-width="handleWidthChange" class="avatar-container">
        <!-- 点击头像触发抽屉 -->
        <el-avatar class="cczj-cursor-pointer" :size="36" :src="user?.avatar" @click="drawerVisible = true" />
        <!-- 抽屉 -->
        <el-drawer v-model="drawerVisible" :direction="'rtl'" :size="`${drawerWidth}px`">
          <template #header="{ titleId, titleClass }">
            <h4 :id="titleId" :class="titleClass">个人中心</h4>
            <BaseAuthComponent :text-show="true" :role-id="user.role.role_id" />
            <span class="header-score cczj-pt-1">诚信豆：{{ user?.bean }} 颗</span>
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
              <el-menu text-color="var(--el-menu-text-color)" :ellipsis="false" mode="horizontal" :default-active="'1'"
                class="el-menu-vertical-demo">
                <el-menu-item @click="handleDrawerMenu('collect')" index="1">
                  收藏：{{ user.collect_count }}
                </el-menu-item>
                <el-menu-item @click="handleDrawerMenu('publish')" index=" 2">
                  发布：{{ user.publish_count }}
                </el-menu-item>
              </el-menu>
            </div>
            <div>
              <el-scrollbar height="400px">
                <div>
                  <div v-for="data in drawerMenuList" :key="data.id" class="menu-card">
                    <div @click="handleToDeatails(data.id)" class="cczj-flex cczj-items-center menu-card-title">
                      <span>标题：{{ data.title ? data.title : '无标题' }}</span>
                      <el-tag class="cczj-mt-3 cczj-ml-3">已发布</el-tag>
                    </div>
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </div>
          <div class="drawer-footer">
            <div class="top-content">
              <el-button @click="innerDrawer = true" type="info" class="drawer-setting">
                <el-icon :size="16" class="setting-icon">
                  <Setting />
                </el-icon>
                <span class="setting-text">
                  设置
                </span>
                <el-drawer v-model="innerDrawer" :size="drawerWidth" :append-to-body="true">
                  <template #header="{ titleId, titleClass }">
                    <h4 :id="titleId" :class="titleClass">个人中心</h4>
                    <span class="header-score">个人诚信豆：{{ user?.bean }} 颗</span>
                  </template>
                  <el-form ref="ruleFormRef" :rules="rules" :model="ruleForm" label-width="auto">
                    <el-form-item label="昵称: " prop="nickname">
                      <el-tooltip content="30天内不可以重复修改昵称" placement="left">
                        <el-input :disabled="getStorageFromKey('cczj_nickname') !== null" v-model="ruleForm.nickname"
                          placeholder="请输入昵称"></el-input>
                      </el-tooltip>
                    </el-form-item>
                    <el-form-item label="密码: " prop="password">
                      <el-input type="password" v-model="ruleForm.password" placeholder="请输入密码"
                        show-password></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱: " prop="email">
                      <el-input v-model="ruleForm.email" placeholder="请输入邮箱地址"></el-input>
                    </el-form-item>
                    <el-form-item label="头像: ">
                      <el-input v-model="ruleForm.avatar" placeholder="请输入头像地址"></el-input>
                    </el-form-item>
                    <el-form-item label="签名: ">
                      <el-input v-model="ruleForm.signature" type="textarea" />
                    </el-form-item>
                    <el-form-item label="性别">
                      <el-radio-group v-model="ruleForm.gender">
                        <el-radio :label="1">男</el-radio>
                        <el-radio :label="0">女</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-button @click="settingBtn" type="success">提交</el-button>
                  </el-form>
                </el-drawer>
              </el-button>
              <el-button @click="LoginAdmin" class="admin-into" type="success">管理页面</el-button>
              <el-button @click="Logout" class="logout-btn" type="success">退出登录</el-button>
            </div>
            <div class="bottom-dailyImage">
              <img :src="dailyImage" alt="广告位" />
            </div>
          </div>
        </el-drawer>
      </div>
      <el-dialog v-model="dialogLogin" @close="handleCancelDialog(false)" class="login-dialog" width="700px"
        :before-close="handleClose">
        <div>
          <div class="login-top">
            <div @click="dialogType = false" :class="dialogType ? '' : 'active'" class="content job-content">
              <img src="https://static.nowcoder.com/fe/file/oss/1689329076959EQVSW.png" alt="求职者">我是求职者
            </div>
            <img @click="dialogType = false" :src="dialogType ? 'https://static.nowcoder.com/fe/file/oss/1688615753578AHSOY.png'
              : 'https://static.nowcoder.com/fe/file/oss/1688615533943XCPPM.png'" alt="我是求职者"
              :class="dialogType ? '' : 'active'" class="job">
            <div @click="dialogType = true" :class="dialogType ? 'active' : ''" class="recruit-content content">
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
                      <li @click="dialogLoginType = false" :class="!dialogLoginType ? 'active' : ''"
                        class="sparta-login-form-tab-item sparta-login-form-tab-item-cus">
                        注册登录
                        <div v-show="!dialogLoginType" class="sparta-login-form-tab-active-bottom">
                        </div>
                      </li>
                      <li @click="dialogLoginType = true" :class="dialogLoginType ? 'active' : ''"
                        class="sparta-login-form-tab-item sparta-login-form-tab-item-cus">
                        密码登录
                        <div v-show="dialogLoginType" class="sparta-login-form-tab-active-bottom">
                        </div>
                      </li>
                    </ul>
                  </div>
                  <el-form v-show="!dialogLoginType" ref="refForm" :model="refPhoneLogin" :rules="rulePhone">
                    <el-form-item prop="mobile">
                      <el-input type="tel" class="el-input-group" v-model="refPhoneLogin.mobile" placeholder="请输入手机号">
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
                  <el-form v-show="dialogLoginType" ref="refFormEmail" :model="refEmailLogin" :rules="ruleEmail">
                    <el-form-item prop="key">
                      <el-input class="el-input-email" v-model="refEmailLogin.key" placeholder="请输入邮箱/手机号">
                      </el-input>
                    </el-form-item>
                    <el-form-item prop="password">
                      <el-input v-model="refEmailLogin.password" placeholder="请输入密码"></el-input>
                    </el-form-item>
                    <el-button @click="handleLoginBtn" class="form-btn" type="primary">登录</el-button>
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
      <el-dialog :class="isFull ? 'dialog-full' : 'dialog-message'" :modal="false" :close-on-click-modal="false"
        :fullscreen="isFull" v-model="dialogMessage" @close="handleCloseWebsocket" draggable>
        <!-- 最外层页面于窗口同宽，使聊天面板居中 -->
        <div class="home-view">
          <!-- 整个聊天面板 -->
          <div class="chat-panel">
            <!-- 左侧的会话列表 -->
            <div class="session-panel">
              <div class="title">CCZJ沟通助手</div>
              <div class="description">构建你的朋友圈吧</div>
              <el-scrollbar style="height: 80%;">
                <div class="cczj-mr-3 session-list">
                  <!-- for循环遍历会话列表用会话组件显示，并监听点击事件和删除事件。点击时切换到被点击的会话，删除时从会话列表中提出被删除的会话。 -->
                  <!--  -->
                  <BaseMessageCard v-for="session in sessions" :key="session.id"
                    :active="session.id === activeSession?.id" :session="session" class="session"
                    @click="handleSessionSwitch(session)" @delete="handleCloseSession" />
                </div>
              </el-scrollbar>
              <div class="action-wrapper">
                <div class="cczj-mr-1">
                  <el-button @click="isFull = !isFull">
                    <el-icon :size="15" class="el-icon--left">
                      <FullScreen />
                    </el-icon>
                    {{ isFull ? '退出全屏' : '全屏' }}
                  </el-button>
                  <el-button class="cczj-ml-1" @click="dialogSearchUser = true">
                    <el-icon :size="15" class="el-icon--left">
                      <CirclePlus />
                    </el-icon>
                    新的聊天
                  </el-button>
                </div>
              </div>
            </div>
            <!-- 右侧的消息记录 -->
            <div class="message-panel">
              <div class="cczj-flex cczj-items-center cczj-mt-1">
                <el-input v-show="activeSession" :class="{ 'box-show': topicOnlyRead }" maxlength="30"
                  :readonly="topicOnlyRead" v-model="sessionTopic" class="topic-input cczj-ml-3 cczj-mr-1"
                  @blur="handleEditSession(activeSession?.id)" @keydown.enter="handleEditSession(activeSession?.id)" />
                <el-icon v-show="activeSession && topicOnlyRead" class="cczj-cursor-pointer"
                  @click="topicOnlyRead = false">
                  <EditPen />
                </el-icon>
                <div class="cczj-flex cczj-items-center target-info">
                  <el-avatar class="cczj-mr-3" :size="36" :src="activeSession?.target_user?.avatar" />
                  <span class="header-name">{{ activeSession?.target_user?.nickname }}</span>
                </div>
              </div>
              <el-divider :border-style="'solid'" />
              <el-scrollbar ref="messageScrollBar" style="height: 70%;">
                <div class="message-list">
                  <BaseMessageRow v-for="message in activeSession?.messages" :key="message.create_at"
                    :position="message.user_id === user.user_id ? 'right' : 'left'" :message="message"
                    :user="message.user_id === user.user_id ? user : activeSession?.target_user" />
                </div>
              </el-scrollbar>
              <div class="message-input">
                <div class="input-wrapper">
                  <!-- 按回车键发送，输入框高度三行 -->
                  <el-input v-model="messageContent" :autosize="false" :rows="3" class="input" resize="none"
                    type="textarea" @keydown.enter="sendMessage">
                  </el-input>
                  <div v-show="activeSession" class="button-wrapper">
                    <el-button type="primary" @click="sendMessage">
                      <el-icon class="el-icon--left">
                        <Position />
                      </el-icon>
                      发送
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-dialog>
      <el-dialog @keydown.enter="handleSearchUser" class="dialog-search" :close-on-click-modal="false" :modal="false"
        v-model="dialogSearchUser" @close="dialogSearchUser = false" draggable>
        <el-input class="dialog-input cczj-mb-5" v-model="dialogSearchInput">
          <template #append>
            <el-icon class="cczj-cursor-pointer" @click="handleSearchUser">
              <Search />
            </el-icon>
            <el-button maxlength="200" clearable @click="handleSearchUser" type="success"
              icon="el-icon-search">搜索</el-button>
          </template>
        </el-input>
        <div class="search">
          <div class="search-box cczj-flex-wrap cczj-flex cczj-ml-80">
            <el-card v-for="user in dialogUsers" :key="user.id" class="cczj-ml-3 search-card">
              <div class="card-info cczj-flex">
                <el-avatar :size="32" :src="user.avatar" />
                <el-button @click="handleCreateSession(user.user_id)" class="cczj-ml-5" type="success"
                  size="small">沟通</el-button>
              </div>
              <div class="cczj-mt-3">{{ user.nickname }}</div>
            </el-card>
          </div>
          <el-pagination v-show="dialogUsersCount > 9" size="small" background layout="prev, pager, next"
            :total="dialogUsersCount" class="cczj-ml-80 cczj-mt-4" />
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
  --webkit-appearance: none;
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

.avatar-container .header-auth {
  color: #666;
  font-size: 14px;
  margin-right: 30px;
  text-align: center;
}

.avatar-container .header-score {
  color: #666;
  font-size: 14px;
  margin-right: 30px;
  text-align: center;
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

.menu-card {
  box-shadow: 0 1px 1px 1px rgba(8, 8, 8, 0.1);
  margin: 5px;
  height: 60px;
  border-radius: 5px;
}

.menu-card:hover {
  background-color: var(--project_base_color);
  cursor: pointer;
}

.menu-card .menu-card-title {
  justify-content: space-between;
  line-height: 20px;
  margin: 0 10px;
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
  width: 32px;
  height: 32px;
}

nav .avatar-container .drawer-footer .drawer-setting:hover {
  width: 64px;
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

nav .avatar-container .drawer-footer .admin-into {
  width: 100px;
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
  opacity: 0.9;
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
  margin-left: 25px;
}

:deep(.el-dialog__headerbtn) {
  top: 10px
}

:deep(.dialog-message) {
  border-radius: 50% !important;
}

:deep(.dialog-full .el-dialog__body) {
  height: 100% !important;
}

.dialog-full .home-view {
  margin-top: -35px !important;
  height: 100% !important;
}

.dialog-full .home-view .chat-panel {
  width: 100% !important;
}

.dialog-full .home-view .session-panel {
  width: 25% !important;
}

.dialog-full .home-view .message-panel {
  width: 75% !important;
}

.message-panel .topic-input {
  width: 100px !important;
}

:deep(.message-panel .box-show .el-input__wrapper) {
  box-shadow: none !important;
}

.target-info {
  margin: 0 25%
}

:deep(.el-divider--horizontal) {
  margin: 5px 0;
}

.home-view {
  display: flex;
  /* 水平方向上剧中 */
  justify-content: center;
  margin-top: -20px;
}

@media screen and (max-width: 2024px) {
  .home-view {
    height: 700px;
  }

  .home-view .session-panel {
    width: 260px;
  }

  .home-view .message-panel {
    width: 700px;
  }
}

@media screen and (max-width: 1536px) {
  .home-view {
    height: 600px;
  }

  .home-view .session-panel {
    width: 220px;
  }

  .home-view .message-panel {
    width: 570px;
  }
}

@media screen and (max-width: 1280px) {
  .home-view {
    height: 550px;
  }

  .home-view .session-panel {
    width: 180px;
  }

  .home-view .message-panel {
    width: 470px;
  }

}

@media screen and (max-width: 1024px) {
  .home-view {
    height: 500px;
  }

  .home-view .session-panel {
    width: 150px;
  }

  .home-view .message-panel {
    width: 370px;
  }
}

@media screen and (max-width: 768px) {
  .home-view {
    height: 300px;
    width: 100px;
  }
}

.home-view,
.chat-panel {
  /* 聊天面板flex布局，让会话列表和聊天记录左右展示 */
  display: flex;
  /* 让聊天面板圆润一些 */
  border-radius: 20px;
  background-color: white;
  /* 给一些阴影 */
  box-shadow: 0 0 20px 20px rgba(0, 255, 255, 0.05);
  /* 与上方增加一些间距 */
  /* 左侧聊天会话面板*/
}

.home-view .chat-panel .session-panel {
  background-color: rgb(231, 248, 255);
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  padding: 20px;
  position: relative;
  border-right: 1px solid rgba(0, 0, 0, 0.07);
}

.home-view .chat-panel .title {
  margin-top: 20px;
  font-size: 20px;
}

.home-view .chat-panel .description {
  color: rgba(black, 0.7);
  font-size: 10px;
  margin-top: 10px;
}

.message-list {
  min-height: 480px;
  padding: 20px;
}

.message-list .list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.message-list .list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.message-input {
  position: absolute;
  top: 80%;
  width: 73%;
  padding: 20px;
  border-top: 1px solid rgba(8, 8, 8, 0.07);
}

.session-list .session {
  /* 每个会话之间留一些间距 */
  margin-top: 20px;
}

.action-wrapper {
  /* session-panel是相对布局，这边的button-wrapper是相对它绝对布局 */
  position: absolute;
  bottom: 20px;
  left: 0;
  display: flex;
  /* 让内部的按钮显示在右侧 */
  justify-content: flex-end;
  /* 宽度和session-panel一样宽*/
  width: 100%;
}

.button-wrapper {
  /* session-panel是相对布局，这边的button-wrapper是相对它绝对布局 */
  display: flex;
  /* 让内部的按钮显示在右侧 */
  justify-content: flex-end;
  margin-top: 10px;
}

:deep(.dialog-search) {
  height: 500px;
}

.dialog-input {
  width: 80%;
  margin-left: 10%;
  height: 40px;
}

.search .search-box {
  gap: 10px;
  width: 100%;
}

.dialog-search .search-card {
  flex: 0 0 calc(25% - 10px * 3 / 4);
  /* 四列计算 */
  max-width: calc(25% - 10px * 3 / 4);
  /* 防止弹性扩展 */
  box-sizing: border-box;
  user-select: none;
}

.dialog-search .search-card:hover {
  background-color: #eefaf7;
}

.card-info {
  align-items: flex-start;
  justify-content: space-between;
}

@media (max-width: 1200px) {
  .search-card {
    /* 三列计算 */
    flex-basis: calc(33.33% - 10px * 2 / 3);
    max-width: calc(33.33% - 10px * 2 / 3);
  }
}
</style>