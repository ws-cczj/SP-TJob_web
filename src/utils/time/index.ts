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

export const generateRandomDateTime = () => {
    // 获取当前时间和未来7天的时间范围 
    const now = new Date();
    // 生成随机时间戳（当前时间到未来7天内的随机毫秒数）
    const randomTime = now.getTime()  + Math.random()  * 604800;
    const randomDate = new Date(randomTime);
 
    return randomDate.getTime() - now.getTime();
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
export const formatTimeNoDetail = (time: string | number | undefined): string => {
  if (typeof time === 'undefined') { 
    return '2006-01-02'
  }
    const date = new Date(time)
    return `${date.getFullYear()}-${padZero(date.getMonth()+1)}-${padZero(date.getDate())}`
}

// 判断当前时间是否超过两分钟
export const isExceedOneMinute = (timeStr: string|undefined): boolean => {
  if (typeof timeStr === 'undefined') return false;
    try {
        // 转换字符串为Date对象（兼容格式）
        const inputDate = new Date(timeStr.replace(/-/g,  '/'));
        const currentDate = new Date();
        
        // 计算时间差（毫秒）
        const diff = currentDate.getTime()  - inputDate.getTime(); 
        
        // 判断是否超过2分钟 
        return diff > 120000;
    } catch (e) {
        console.error("Invalid  date format:", e);
        return false;
    }
}

/**
 * 计算传入时间与当前时间的差值，返回人性化时间描述 
 * @param timeString 时间字符串
 * @returns 时间差描述或原字符串 
 */
export const timeAgo = (timeString: string|undefined): string => {
    if (typeof timeString === 'undefined') return getTimeNow();
    try {
      const targetDate = new Date(timeString);
      const currentDate = new Date();
      
      // 验证日期有效性 [16]()
      if (isNaN(targetDate.getTime()))  return formatTimeNoDetail(timeString);

      // 计算时间差（毫秒）
      const timeDiff = currentDate.getTime()  - targetDate.getTime(); 
      
      // 计算时间差单位 [17]()
      const seconds = Math.floor(timeDiff  / 1000);
      const minutes = Math.floor(seconds  / 60);
      const hours = Math.floor(minutes  / 60);
      const days = Math.floor(hours / 24);
    
        // 判断时间区间 [9]()
      if (days > 30) return formatTimeNoDetail(timeString); // 超过30天返回原时间
      if (hours > 24) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
        
      return "刚刚";  // 小于1分钟 
    } catch (e) {
      return formatTimeNoDetail(timeString);  // 异常情况返回原字符串 [5]()
    }
}