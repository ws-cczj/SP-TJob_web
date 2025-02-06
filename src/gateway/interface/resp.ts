// 定义全局响应类型
export declare interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}