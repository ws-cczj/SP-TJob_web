export interface UserResp {
  id: number
  gender: number
  score: number
  publish_count: number
  collect_count: number
  user_id: string
  nickname: string
  avatar: string
  mobile: string
  email: string
  signature: string
}

export interface LoginResp {
  token: string
  user: UserResp
}

export interface RegisterResp {
  token: string
  user: UserResp
}

export interface SmsSendResp {
  code: string
}