// actions 接口定义
import type { CreateActions } from '../type';
import type { DataState } from './state';

interface Action {
  queryUsers(): void;
  setDialogLogin(isOpen: boolean): void
  setDialogSessionId(sessionId: string): void;
	setDrawerWidth(width: number): void;
  setDarkMode(isDark: boolean): void;
  setMarkDownContent(content: string): void;
}

export type DateActions = CreateActions<string, DataState, Action>;
