import { TagResp } from "./tagResp"
import { UserResp } from "./userResp"
import { CommentResp } from "./commentResp"
import { UploadFiles } from "element-plus"

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
  comment: string
  author: UserResp
  comments: CommentResp[]
  images: UploadFiles
  tags: TagResp[]
  create_at: string
  update_at: string
}

export declare interface FeedDraftPostResp {
  posts: PostResp[]
  token: string
}

export declare interface DraftPostResp {
  post: PostResp
  token: string
}

export declare interface FeedPostResp {
  posts: PostResp[]
}

export declare interface SearchPostResp {
  posts: PostResp[]
}

export declare interface HotPostResp {
  posts: PostResp[]
}

export declare interface VisitorPostResp {
  posts: PostResp[]
}
export declare interface DetailsPostResp {
  post: PostResp
}
export declare interface CollectPostResp {
  posts: PostResp[]
}
export declare interface PublishPostResp {
  posts: PostResp[]
}