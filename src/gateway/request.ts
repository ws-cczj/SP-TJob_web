import Axios, { HttpStatusCode, type AxiosInstance, type AxiosResponse } from 'axios'
import { errorMsg } from '../utils/message/message';
import { getStorageFromKey } from '../utils/storage/config';
import {Log} from '../utils/log/log';
import {type ApiResponse} from './interface/resp'

const env = import.meta.env
Log.info('gateway/request.ts', 'env: ', env)
// 使用 store/index.js 文件处理等待加载事件
const client: AxiosInstance = Axios.create({
  baseURL: env.VITE_APP_GATEWAY_BASEURL,
  timeout: env.VITE_APP_GATEWAY_TIMEOUT,
  withCredentials: env.VITE_APP_GATEWAY_WITHCREDENTIALS
})

// 注册axios请求拦截器
client.interceptors.request.use(
  (req) => {
    const token = getStorageFromKey('cczj_token')
    if (token) {
      req.headers['Authorization'] = token;
    }
    return req
  }, (err) => console.log(err)
)

// 注册axios响应拦截器
client.interceptors.response.use(
  (resp: AxiosResponse<ApiResponse<any>>) => {
    const { status, data } = resp
    if (status && status === HttpStatusCode.Ok) {
      Log.debug('gateway/request', '请求成功: ')
      return resp;
    } else if (status === HttpStatusCode.Unauthorized) {
      Log.debug('gateway/request', '认证失效: ')
      errorMsg('登录已过期，请重新登录')
      // 重定向到登录页面
      window.location.href = '/'
      return Promise.reject(resp);
    }
    Log.error('gateway/request', 'data: ', data)
    return Promise.reject(resp);
  }, (err) => console.log(err)
)

export default client