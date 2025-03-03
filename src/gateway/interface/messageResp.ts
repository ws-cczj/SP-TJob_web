import type { UserResp } from "./userResp";

export declare interface MessageResp {
  id: string;
  user_id: string;
  target_id: string
  content: string;
  create_at: string;
  status: number; // 0 发送失败, 1 未读, 2 已读, 3 撤回
}

export declare interface SessionResp {
  status: number; // 0 打开， 1 关闭
  id: number;
  user_id: string;
  target_id: string;
  topic: string;
  target_user: UserResp
  messages: MessageResp[];
  create_at: string;
  update_at: string;
}

export declare interface FeedSeesionResp {
  sessions: SessionResp[];
  users: UserResp[];
  token: string;
}

export declare interface CreateSessionResp {
  session: SessionResp;
  token: string;
}