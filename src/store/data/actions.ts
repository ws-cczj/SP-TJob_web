// action 定义
import type { DateActions } from './actions-types';

export const actions: DateActions = {
  queryUsers() {
  },
  setDialogSessionId(sessionId: string) {
    if (this.dialogSessionId === sessionId || sessionId === "") return;
    this.dialogSessionId = sessionId;
  },
  setDialogLogin(isOpen: boolean) {
    if (this.dialogLogin === isOpen) return;
    this.dialogLogin = isOpen;
  },
  setDrawerWidth(width: number) { 
    if(this.drawerWidth === width) return;
    this.drawerWidth = width;
  },
  setDarkMode(isDark: boolean) {
    if (this.isDark === isDark) return;
    this.isDark = isDark;
  },
  setMarkDownContent(content: string) {
    if (this.markdownContent === content) return;
    console.log('setMarkDownContent', content);
    this.markdownContent = content;
  }
};