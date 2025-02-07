// action 定义
import type { DateActions } from './actions-types';

export const actions: DateActions = {
  queryUsers() {
  },
  setDrawerWidth(width: number) { 
    if(this.drawerWidth === width) return;
    this.drawerWidth = width;
  },
  setDarkMode(isDark: boolean) {
    if (this.isDark === isDark) return;
    this.isDark = isDark;
  }
};