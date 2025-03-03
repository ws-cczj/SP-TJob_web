import { UserResp } from "./userResp";

export declare interface CommentResp {
  id: number;
  f_id: number;
  user_id: number;
  target_id: number;
  content: string;
  create_at: string;
  author: UserResp;
  childs: CommentResp[];
  isLike: boolean;
  liked_count: number;
  commented_count: number;
}

export declare interface CreateCommentResp {
  comment: CommentResp;
  token: string;
}