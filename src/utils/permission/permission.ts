/**
 * @return {boolean} 是否有该权限
 * @param permissionRoles 该角色权限
 * @param needPermission 需要的权限
 */
export default function hasPermission(permissionRoles: string | undefined, needPermission: string): boolean { 
  if (typeof permissionRoles === 'undefined') {
    return false;
  }
  if (permissionRoles === '*') {
    return true
  }
  var permissions = permissionRoles.split('.');
  for(var permission in permissions) {
    if(permission === needPermission) {
      return true;
    }
  }
  return false;
}