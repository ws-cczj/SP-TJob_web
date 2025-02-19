import { UserResp } from "@/gateway/interface/userResp";

// state 定义
export interface DataState {
  drawerWidth?: number;
  isDark?: boolean;
  markdownContent?: string;
  user?: UserResp;
}

export const state: DataState = {
  drawerWidth: 400,
  isDark: false,
  markdownContent: "",
  user: {
    id: -1,
    gender: 0,
    score: 0,
    user_id: "",
    nickname: "",
    avatar: "",
    email: "",
    mobile: "",
    signature: "",
    role: {
      id: -1,
      description: "",
      role_id: 20,
      permission: "",
    },
    password: "",
    collect_count: 0,
    publish_count: 0,
  }
};