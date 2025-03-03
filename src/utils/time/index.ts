// 时间格式补零工具函数 
const padZero = (n: number): string => n.toString().padStart(2,  '0')
 
// 获取当前时间 
export const getTimeNow = (): string => {
    const now = new Date()
    return `${now.getFullYear()}-${padZero(now.getMonth()+1)}-${padZero(now.getDate())} ` +
           `${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}` 
}
 
// 获取10分钟后的时间
export const getTimeTenMinutes = (): string => {
    const now = new Date()
    const future = new Date(now.getTime()  + 10*60*1000) // 增加10分钟 
    return `${future.getFullYear()}-${padZero(future.getMonth()+1)}-${padZero(future.getDate())} ` +
           `${padZero(future.getHours())}:${padZero(future.getMinutes())}:${padZero(future.getSeconds())}` 
}
 
// 获取指定天数后的时间（支持正负）
export const getTimeToDay = (day: number): string => {
    const now = new Date()
    const target = new Date(now.getTime()  + day*24*60*60*1000) // 按天数计算毫秒数
    return `${target.getFullYear()}-${padZero(target.getMonth()+1)}-${padZero(target.getDate())} ` +
           `${padZero(target.getHours())}:${padZero(target.getMinutes())}:${padZero(target.getSeconds())}` 
}
// 转换时间格式为当前标准格式
export const formatTime = (time: string | undefined): string => {
  if (typeof time === 'undefined') { 
    return '2006-01-02 15:04:05'
  }
    const date = new Date(time)
    return `${date.getFullYear()}-${padZero(date.getMonth()+1)}-${padZero(date.getDate())} ` +
           `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}` 
}

// 转换时间格式为当前标准格式 无时分秒
export const formatTimeNoDetail = (time: string | undefined): string => {
  if (typeof time === 'undefined') { 
    return '2006-01-02'
  }
    const date = new Date(time)
    return `${date.getFullYear()}-${padZero(date.getMonth()+1)}-${padZero(date.getDate())}`
}