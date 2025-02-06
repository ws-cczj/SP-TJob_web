import { encrypt, decrypt } from "./encry";
import type globalConfig from "./interface";
const config: globalConfig = {
  type: 'localStorage',              //存储类型，localStorage | sessionStorage
  prefix: import.meta.env.VITE_APP_PROJECT + '_0.0.1',     //版本号
  expire: 24 * 30 * 60,                   //过期时间，默认为30天，单位为分钟
  isEncrypt: true,                   //支持加密、解密数据处理
};

/**
 * 
 * @param key 加密数据标识
 * @param value 加密数据
 * @param expire 加密数据过期时间，默认单位为分钟
 * @returns 是否执行成功
 */
const setStorage = (key: string, value: any, expire: number = 24 * 30 * 60): boolean => {
  //设定值
  if (value === '' || value === undefined) {
    //空值重置
    value = null;
  }
  if (isNaN(expire) || expire < 0) {
    //过期时间值合理性判断
    throw new Error('Expire must be a number');
  }
  const data = {
    value, //存储值
    time: Date.now(), //存储日期
    expire: Date.now() + 60000 * expire, //过期时间
  };
  //是否需要加密，判断装载加密数据或原数据
  window[config.type].setItem(
    autoAddPreFix(key),
    config.isEncrypt ? encrypt(JSON.stringify(data)) : JSON.stringify(data),
  );
  return true;
};

/**
 * 
 * @param key 解密需要的标识符
 * @returns 
 */
const getStorageFromKey = (key: string): any => {
  //获取指定值
  if (config.prefix) {
    key = autoAddPreFix(key);
  }
  if (!window[config.type].getItem(key)) {
    //不存在判断
    return null;
  }
  const storageVal = config.isEncrypt
    ? JSON.parse(decrypt(window[config.type].getItem(key) as string))
    : JSON.parse(window[config.type].getItem(key) as string);
  const now = Date.now();
  if (now >= storageVal.expire) {
    //过期销毁
    removeStorageFromKey(key);
    return null;
    //不过期回值
  } else {
    return storageVal.value;
  }
};
const getAllStorage = (): any => {
  //获取所有值
  const storageList: any = {
  };
  const keys = Object.keys(window[config.type]);
  keys.forEach((key) => {
    const value = getStorageFromKey(autoRemovePreFix(key));
    if (value !== null) {
      //如果值没有过期，加入到列表中
      storageList[autoRemovePreFix(key)] = value;
    }
  });
  return storageList;
};
//获取值列表长度
const getStorageLength = () => {
  return window[config.type].length;
};
/**
 * @description 删除指定存储值
 * @param key 数据标识符
 */
const removeStorageFromKey = (key: string) => {
  if (config.prefix) {
    key = autoAddPreFix(key);
  }
  window[config.type].removeItem(key);
};
const clearStorage = () => {
  window[config.type].clear();
};
//添加前缀，保持唯一性
const autoAddPreFix = (key: string) => {
  const prefix = config.prefix || '';
  return `${prefix}_${key}`;
};
//删除前缀，进行增删改查
const autoRemovePreFix = (key: string) => {
  const lineIndex = config.prefix.length + 1;
  return key.substr(lineIndex);
};

export {
  setStorage,
  getStorageFromKey,
  getAllStorage,
  getStorageLength,
  removeStorageFromKey,
  clearStorage,
};