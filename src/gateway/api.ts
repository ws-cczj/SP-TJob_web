import type { AxiosResponse } from 'axios';
import client from './request.ts'
import type { ApiResponse} from './interface/resp.ts';
import { Log } from '../utils/log/log.ts';
import { errorMsg } from '../utils/message/message.ts';
import type { LoginResp, RegisterResp, SmsSendResp } from './interface/userResp.ts';

type Method = 'get' | 'post' | 'put' | 'delete'

class requset {
  constructor() {
  }

  private async exec<T>(method: Method, url: string, params?: any): Promise<any> {
    const resp: AxiosResponse<ApiResponse<T>> = await client[method](url, params);
    const { code, data, msg } = resp.data;
    switch (code) {
      case success: return data;
      case ErrNoAuth: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        // window.location.href = '/login';
        return null;
      };
      case ErrNoCompareParams: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrLimtMobile: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      }
      case ErrNocomparePassword: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      }
      case ErrServerBusy: {
        errorMsg(msg);
        Log.error('gateway/api.ts', msg);
        return null;
      }
      case ErrNoCompareCode: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      default: return null;
    }
  }

  public get<T>(url: string, params?: any): Promise<T> {
    return this.exec<T>('get', url, params)
  }
  public post<T>(url: string, params?: any): Promise<T> {
    return this.exec<T>('post', url, params)
  }
  public put<T>(url: string, params?: any): Promise<T> {
    return this.exec<T>('put', url, params)
  }
  public delete<T>(url: string, params?: any): Promise<T> {
    return this.exec<T>('delete', url, params)
  }
}
const req = new requset()

const success = 200 // 成功

const ErrNoAuth = 40001 // 认证失败
const ErrNoCompareParams = 40003 // 参数错误
const ErrLimtMobile = 40005 // 手机号码限制
const ErrNocomparePassword = 40006 // 用户密码不匹配

const ErrServerBusy = 50000 // 服务器繁忙
const ErrNoCompareCode = 51003 // 验证码错误

// 避免函数被全部调用，所以返回一个函数本身，而不是结果
export const login = (path: string, data: any) => req.post<LoginResp>(path, data)
export const register = (path: string, data: any) => req.post<RegisterResp>(path, data)
export const smsSend = (path: string) => req.get<SmsSendResp>(path)
export const dailyApi = (path: string) => req.get(path)