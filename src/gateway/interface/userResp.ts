export declare interface UserResp {
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

export declare interface UserInfoResp {
  user: UserResp
  token: string
}

export declare interface LoginResp {
  token: string
  user: UserResp
}

export declare interface RegisterResp {
  token: string
  user: UserResp
}

export declare interface SmsSendResp {
  code: string
}

export declare interface SearchUserResp {
  users: UserResp[]
  count: number
  token: string
}