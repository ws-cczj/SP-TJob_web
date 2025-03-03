import Axios, { HttpStatusCode, type AxiosInstance, type AxiosResponse } from 'axios'
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
  }, (err) => Log.error('gateway/request', 'err: ', err)
)

// 注册axios响应拦截器
client.interceptors.response.use(
  (resp: AxiosResponse<ApiResponse<any>>) => {
    const { status, data } = resp
    
    if (status && status === HttpStatusCode.Ok) {
      Log.debug('gateway/request', '请求成功: ')
      return resp;
    }
    Log.error('gateway/request', 'data: ', data)
    return Promise.reject(resp);
  }, (err) => Log.error('gateway/request', 'err: ', err)
)

export default client