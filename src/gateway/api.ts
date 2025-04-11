import type { AxiosResponse } from 'axios';
import client from './request.ts'
import { Log } from '../utils/log/log.ts';
import { errorMsg } from '../utils/message/message.ts';
import type { ApiResponse, CalendarResp, NULLResp, TokenResp } from './interface/resp.ts';
import type { CreateTagResp } from './interface/tagResp.ts';
import type { LoginResp, RegisterResp, SearchUserResp, SmsSendResp, UserInfoResp } from './interface/userResp.ts';
import type { CollectPostResp, DetailsPostResp, DraftPostResp, FeedDraftPostResp, FeedPostResp, HotPostResp, PublishPostResp, SearchPostResp, VisitorPostResp } from './interface/postResp.ts';
import { CreateCommentResp } from './interface/commentResp.ts';
import { CreateSessionResp, FeedSeesionResp } from './interface/messageResp.ts';
import { clearStorage, getStorageFromKey, setStorage } from '@/utils/storage/config.ts';
import router from '@/router/index.ts';
import store from '@/store/index.ts';
import { RecommendCircleResp, SearchCircleResp } from './interface/circleResp.ts';
import { FeedTalkResp } from './interface/talkResp.ts';

type Method = 'get' | 'post' | 'put' | 'delete'

class requset {
  constructor() {
  }

  private async exec<T>(method: Method, url: string, params?: any): Promise<any> {
    const resp: AxiosResponse<ApiResponse<T>> = await client[method](url, params);
    const { code, data, msg } = resp.data;
    switch (code) {
      case success: return data;
      case notfound: {
        Log.warning('gateway/api.ts', msg);
        router.push('/notfound')
        return null;
      }
      case ErrNoAuth : {
      Log.error('gateway/api', '认证失效: ')
      errorMsg('登录已过期，请重新登录')
      const nickname = getStorageFromKey('nickname')
      if (nickname) {
        setStorage('nickname', nickname)
      }
      clearStorage()
      // 重定向到登录页面
      router.push('/')
      store.data.setDialogLogin(true)
      return null;
      };
      case ErrGenToken: {
      Log.error('gateway/api', '认证失效: ')
      errorMsg('登录已过期，请重新登录')
      const nickname = getStorageFromKey('nickname')
      if (nickname) {
        setStorage('nickname', nickname)
      }
      clearStorage()
      // 重定向到登录页面
      router.push('/')
      store.data.setDialogLogin(true)
      return null;
      };
      case ErrTokenExpired: {
      Log.error('gateway/api', '认证失效: ')
      errorMsg('登录已过期，请重新登录')
      const nickname = getStorageFromKey('nickname')
      if (nickname) {
        setStorage('nickname', nickname)
      }
      clearStorage()
      // 重定向到登录页面
      router.push('/')
      store.data.setDialogLogin(true)
      return null;
      };
      case ErrBanned: {
      Log.debug('gateway/api', '已被封禁: ')
      errorMsg('该用户已被封禁')
      clearStorage()
      // 重定向到登录页面
      router.push('/')
      return null;
      };
      case ErrOtherLogin: {
        Log.error('gateway/api', '其他地区二次登录: ')
        errorMsg('其他地区二次登录，如果不是本人请及时修改密码')
        const nickname = getStorageFromKey('nickname')
        clearStorage()
        if (nickname) {
          setStorage('nickname', nickname)
        }
        // 重定向到登录页面
        router.push('/')
        store.data.setDialogLogin(true)
        return null;
        }
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
const notfound = 404 // 页面未找到

const ErrNoAuth = 40208 // 认证失败
const ErrTokenExpired = 40209 // 认证失败
const ErrGenToken = 40210 // 认证失败
const ErrOtherLogin = 40211 // 其他地方登录
const ErrBanned = 40300 // 被封禁
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
export const getUserinfo = () => req.get<UserInfoResp>('/user/info')
export const smsSend = (mobile:string) => req.get<SmsSendResp>(`/user/smsSend?mobile=${mobile}`)
export const ban = (targetId: string, banAt:string) => req.put<TokenResp>(`/user/ban/${targetId}?banAt=${banAt}`)
export const createTag = (tagInfo:any) => req.post<CreateTagResp>(`/tag/create`, tagInfo)
export const removeTag = (tagId: number) => req.delete<TokenResp>(`/tag/remove`, tagId)
export const getDraftPosts = () => req.get<FeedDraftPostResp>(`/post/draft`)
export const createDraftPost = () => req.post<DraftPostResp>(`/post/draft/create`)
export const savePostContent = (data: any) => req.put<NULLResp>(`/post/content`, data)
export const updatePostTags = (data: any) => req.put<TokenResp>(`/post/tag/update`, data)
export const saveUnloadBefore = (data: any) => req.put<TokenResp>(`/post/unloadBefore`, data)
export const publishPost = (data: any) => req.put<TokenResp>(`/post/publish`, data)
export const editPost = (postId: number) => req.put<TokenResp>(`/post/edit/${postId}`)
export const getFeedPost = (pageCount: number, ids: string) => req.get<FeedPostResp>(`/post/feed?pageCount=${pageCount}&ids=${ids}`)
export const getVisitorPost = (pageCount: number, ids: string) => req.get<VisitorPostResp>(`/post/visitor?pageCount=${pageCount}&ids=${ids}`)
export const getDetailsPost = (postId:number) => req.get<DetailsPostResp>(`/post/details/${postId}`)
export const getVisitorDetailsPost = (postId:number) => req.get<DetailsPostResp>(`/post/visitor/details/${postId}`)
export const savePostComment = (data: any) => req.put<TokenResp>(`/post/details/comment`, data)
export const removePost = (postId:number) => req.put<TokenResp>(`/post/remove/${postId}`)
export const likePost = (targetId:number, targetType:number) => req.post<TokenResp>(`/favor/like?targetId=${targetId}&targetType=${targetType}`)
export const cancelLikePost = (targetId:number, targetType:number) => req.put<TokenResp>(`/favor/cancel?targetId=${targetId}&targetType=${targetType}`)
export const collectPost = (targetId:number) => req.post<TokenResp>(`/collect/collect/${targetId}`)
export const cancelCollectPost = (targetId:number) => req.put<TokenResp>(`/collect/cancel/${targetId}`)
export const createComment = (data: any) => req.post<CreateCommentResp>(`/comment/create`, data)
export const getFeedCollect = () => req.get<CollectPostResp>(`/collect/feed`)
export const getFeedPublishPost = () => req.get<PublishPostResp>(`/post/publish/feed`)
export const getPostHot = () => req.get<HotPostResp>(`/post/hot`)
export const getSearchPost = (data:any) => req.get<SearchPostResp>(`/post/search?pageCount=${data.pageCount}&title=${data.title}&ids=${data.ids}`)
export const topPost = (targetId: number) => req.post<TokenResp>(`/post/top/${targetId}`)
export const footerPost = (targetId: number) => req.post<TokenResp>(`/post/footer/${targetId}`)
export const getRecommendCircle = () => req.get<RecommendCircleResp>(`/circle/recommend`)
export const searchCircle = (page: number, content: string) => req.get<SearchCircleResp>(`/circle/search?page=${page}&content=${content}`)
export const getFeedTalks = (circleId: number, page: number) => req.get<FeedTalkResp>(`/talk/feed/${circleId}?page=${page}`)
export const publishTalk = (data: any) => req.post<TokenResp>(`/talk/publish`, data)
export const signIn = () => req.post<TokenResp>(`/calendar/signIn`)
export const signRecords = () => req.get<CalendarResp>(`/calendar/signRecords`)

// websocket
export const getSessions = () => req.get<FeedSeesionResp>(`/ws/session/feed`)
export const createSession = (targetId: string) => req.post<CreateSessionResp>(`/ws/session/create/${targetId}`)
export const closeSession = (id: number) => req.put<TokenResp>(`/ws/session/close/${id}`)
export const updateSessionTopic = (data: any) => req.put<TokenResp>(`/ws/session/update`, data)
export const searchUser = (page: number, content: string) => req.get<SearchUserResp>(`/ws/user/search?page=${page}&content=${content}`)
