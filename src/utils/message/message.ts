import { ElMessage, ElMessageBox } from 'element-plus'

// 普通信息提示
export const infoMsg = (msgInfo: string, duration: number = 3000) => {
  ElMessage({
    type: 'info',
    showClose: true,
    dangerouslyUseHTMLString: true,
    message: msgInfo,
    duration: duration
  })
}

// 成功提示
export const successMsg = (msgInfo: string, duration: number = 3000) => {
  ElMessage({
    type: 'success',
    showClose: true,
    dangerouslyUseHTMLString: true,
    message: msgInfo,
    duration: duration
  })
}

// 警告提示
export const warnMsg = (msgInfo: string, duration: number = 3000) => {
  ElMessage({
    type: 'warning',
    showClose: true,
    dangerouslyUseHTMLString: true,
    message: msgInfo,
    duration: duration
  })
}
// 错误提示
export const errorMsg = (msgInfo: string, duration: number = 3000) => {
  ElMessage({
    type: 'error',
    showClose: true,
    dangerouslyUseHTMLString: true,
    message: msgInfo,
    duration: duration
  })
}


/**
 * 
 * @param msg 弹出消息
 * @param btnName 按钮名称
 * @param type 按钮类型
 * @param title 标题 默认为提示
 * @returns void
 */
// 带一个确定按钮或是按钮的alertBox
export const alertBox = (msg: string, btnName: string, type: any, title?: string,) => {
  let confirmName = btnName == '确定' ? '确定' : '是'
  return ElMessageBox.alert(msg, title || '提示', {
    type: type || 'warning',
    confirmButtonText: confirmName,
    buttonSize: "default",
    dangerouslyUseHTMLString: true
  });
}
/**
 * 
 * @param msg 弹出消息
 * @param btnName 按钮名称
 * @param type 按钮类型
 * @param title 标题 默认为提示
 * @param then 确定后执行函数 默认为空函数
 * @param cancel 取消后执行函数 默认为空函数
 * @returns void
 */
// 带确定取消按钮或者是否按钮的弹出提示框
export const confirmBox = (msg: string, btnName: string, type?: any, title?: string) =>
{
  let confirmName = btnName == '确定' ? '确定' : '是'
  let cancelsName = btnName == '确定' ? '取消' : '否'
  return ElMessageBox.confirm(msg, title || '提示', {
    type: type || 'warning',
    confirmButtonText: confirmName,
    cancelButtonText: cancelsName,
    buttonSize: "default",
    closeOnClickModal: false,
    closeOnPressEscape: false,
    dangerouslyUseHTMLString: true
  });
}

/**
 * 
 * @param msg 弹出消息
 * @param btnName 按钮名称
 * @param type 按钮类型
 * @param title 标题 默认为提示
 * @param then 确定后执行函数 默认为空函数
 * @param cancel 取消后执行函数 默认为空函数
 * @returns void
 */
// 带确定取消按钮或者是否按钮的弹出提示框
export const promptBox = (msg: string, btnName: string, type?: any, title?: string,
 ) =>
{
  let confirmName = btnName == '确定' ? '确定' : '是'
  let cancelsName = btnName == '确定' ? '取消' : '否'
  return ElMessageBox.prompt(msg, title || '提示', {
    type: type || 'warning',
    confirmButtonText: confirmName,
    cancelButtonText: cancelsName,
    buttonSize: "default",
    closeOnClickModal: false,
    closeOnPressEscape: false,
    dangerouslyUseHTMLString: true
  })
}
