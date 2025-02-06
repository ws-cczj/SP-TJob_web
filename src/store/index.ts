
import { useStore as dataStore, type DataStore } from './data';

export interface IAppStore {
	data: ReturnType<DataStore>;
}

const store: IAppStore = {} as IAppStore;

/**
 * 注册app状态库
 */
export const registerStore = () => {
	store.data = dataStore();
};
export default store;



