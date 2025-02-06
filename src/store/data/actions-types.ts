// actions 接口定义
import type { CreateActions } from '../type';
import type { DataState } from './state';

interface Action {
	queryUsers(): void;
	setDrawerWidth(width: number): void;
}

export type DateActions = CreateActions<string, DataState, Action>;
