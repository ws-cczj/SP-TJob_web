import { TagResp } from "./tagResp"
import { UserResp } from "./userResp"
import { CommentResp } from "./commentResp"

export declare interface PostResp {
  is_like: boolean
  is_collect: boolean
  id: number
  views: number // 浏览量
  hots: number // 热度
  collected_count: number // 被收藏数
  liked_count: number // 被喜欢数
  comment_count: number // 评论数
  status: number // 状态
  title: string
  content: string
  author: UserResp
  comments: CommentResp[]
  tags: TagResp[]
  create_at: string
  update_at: string
}

export declare interface DraftPostResp {
  posts: PostResp[]
  token: string
}

export declare interface FeedPostResp {
  posts: PostResp[]
  token: string
}

export declare interface VisitorPostResp {
  posts: PostResp[]
}
export declare interface DetailsPostResp {
  post: PostResp
  token: string
}
export declare interface VisitorDetailsPostResp {
  post: PostResp
}

export declare interface CollectPostResp {
  posts: PostResp[]
  token: string
}
export declare interface PublishPostResp {
  posts: PostResp[]
  token: string
}