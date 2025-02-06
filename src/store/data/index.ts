import { defineStore,type StoreDefinition, acceptHMRUpdate } from 'pinia';
import { state, type DataState } from './state';
import { actions } from './actions';
import type { DateActions } from './actions-types';
import { getters, type DataGetters } from './getters';

export type DataStore = StoreDefinition<string, DataState, DataGetters, DateActions>;

export const useStore: DataStore = defineStore('data', {
	state: () => state,
	actions,
	getters
}) as DataStore;

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));

