import type { AxiosResponse } from 'axios';
import client from './request.ts'
import { Log } from '../utils/log/log.ts';
import { errorMsg } from '../utils/message/message.ts';
import type { ApiResponse, TokenResp } from './interface/resp.ts';
import type { CreateTagResp } from './interface/tagResp.ts';
import type { LoginResp, RegisterResp, SmsSendResp } from './interface/userResp.ts';
import type { DraftPostResp } from './interface/postResp.ts';

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
      case ErrUsernameLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrAvatarLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrPasswordLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrGenderLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrEmailLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrSignatureLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrScoreLimit: {
        errorMsg(msg);
        Log.warning('gateway/api.ts', msg);
        return null;
      };
      case ErrMobileLimt: {
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
      default: {
        errorMsg(msg);
        Log.error('gateway/api.ts', msg);
        return null;
      }
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

const ErrNoAuth = 40208 // 认证失败
const ErrNoCompareParams = 40003 // 参数错误
const ErrUsernameLimit = 40004 // 用户名限制
const ErrMobileLimt = 40005 // 手机号码限制
const ErrAvatarLimit = 40006 // 头像地址限制
const ErrPasswordLimit = 40007 // 密码限制
const ErrGenderLimit = 40008 // 性别限制
const ErrEmailLimit = 40009 // 邮箱限制
const ErrSignatureLimit = 40010 // 签名限制
const ErrScoreLimit = 40011 // 分数不正常
const ErrNocomparePassword = 40101 // 用户密码不匹配

const ErrServerBusy = 50000 // 服务器繁忙
const ErrNoCompareCode = 51003 // 验证码错误

// 避免函数被全部调用，所以返回一个函数本身，而不是结果
export const login = (loginInfo: any) => req.post<LoginResp>('/user/login', loginInfo)
export const register = (registerInfo: any) => req.post<RegisterResp>('/user/register', registerInfo)
export const updateInfo = (userInfo: any) => req.put<TokenResp>('/user/setting', userInfo)
export const smsSend = (mobile:string) => req.get<SmsSendResp>(`/user/smsSend?mobile=${mobile}`)
export const createTag = (tagInfo:any) => req.post<CreateTagResp>(`/tag/create`, tagInfo)
export const removeTag = (tagId: number) => req.delete<TokenResp>(`/tag/remove`, tagId)
export const getDraftPosts = () => req.get<DraftPostResp>(`/post/draft`)
export const savePostContent = (data: any) => req.put<TokenResp>(`/post/content`, data)
export const savePostTitle = (data: any) => req.put<TokenResp>(`/post/title`, data)
export const saveUnloadBefore = (data: any) => req.put<TokenResp>(`/post/unloadBefore`, data)
export const publishPost = (data: any) => req.put<TokenResp>(`/post/publish`, data)