export interface UserResp {
  id: number
  gender: number
  collect_count?: number
  publish_count?: number
  role: RoleResp
  bean: string // 诚信豆
  user_id: string
  nickname: string
  password?: string
  avatar: string
  mobile?: string
  email?: string
  signature?: string
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