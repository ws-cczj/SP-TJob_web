// getters 定义
import type { _GettersTree } from 'pinia';
import type { CreateGetters } from '../type';
import type { DataState } from './state';

export type Getters = {
	/** 有未读信息的 */
    hadUnread(): boolean;
};

export type DataGetters = CreateGetters<DataState, Getters>;

export const getters: DataGetters = {
    hadUnread() {
        return true;
    },
};

