/**
 * TagResp
 * type 填写：success, info, primary, warning, danger
 * source_type 0 帖子, 1 沸点
 */
export interface TagResp {
  id: number;
  author_id?: number;
  type: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  content: string;
}

export interface CreateTagResp {
  tag: TagResp;
  token: string
}