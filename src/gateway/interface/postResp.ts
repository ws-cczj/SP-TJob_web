import { TagResp } from "./tagResp"
import { UserResp } from "./userResp"

export interface PostResp {
  id: number
  views: number // 浏览量
  hots: number // 热度
  collected_count: number // 被收藏数
  status: number // 状态
  title: string
  content: string
  author: UserResp
  tags: TagResp[]
  create_at: string
  update_at: string
}

export interface DraftPostResp {
  posts: PostResp[]
  token: string
}