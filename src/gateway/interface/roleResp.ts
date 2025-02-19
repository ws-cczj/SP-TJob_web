
// 0:超级管理员 1: 管理员 10: 普通用户, 11: 企业用户, 12: 社区先锋, 20: 运营, 21: 审核
// create 创建活动等, delete 删除某些内容, check 检查是否合格, ban 封禁用户, admin 管理员, staff 员工
interface RoleResp {
  id?: number
  role_id: number
  description: string
  permission: string
}