// 定义全局响应类型
export declare interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export declare interface TokenResp {
  token: string;
}

export declare interface NULLResp {
}

export declare interface CalendarResp {
  dates: string[];
}