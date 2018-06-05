import { createStore, combineReducers } from 'redux';
import {
    createAsyncAction,
    getAsyncReducers,
    getAsyncSagas,
    toSuccess,
    toReset,
    toRequest,
    toError,
    toLoad,
} from '../src/index';
import noParamsReducer from '../src/noParamsReducer';
import createHttpReducer from '../src/createHttpReducer';
import createMetaReducer from '../src/createMetaReducer';
import createSaga from '../src/createSaga';
import { getPath, getDataFromProps, noParamsKey } from '../src/asyncHelpers';

const getActionData = getDataFromProps('data');
const getActionMeta = getDataFromProps('meta');

const FIRST_ACTION = 'FIRST_ACTION';
const SECOND_ACTION = 'SECOND_ACTION';

describe('Async Client', () => {
    const firstAction = createAsyncAction(FIRST_ACTION, () => {}, []);
    const secondAction = createAsyncAction(SECOND_ACTION, () => {}, null);

    const reducer = (state, action) => {
        switch(action.type) {
            case FIRST_ACTION:
                return state;
            case SECOND_ACTION:
                return state.filter((val) => val <= 2);
            default:
                return state;
        }
    }

    const customReducer = noParamsReducer(reducer, [FIRST_ACTION, SECOND_ACTION]);

    const store = createStore(
        combineReducers(getAsyncReducers())
    );

    describe('createAsyncAction()', () => {
        it('should create action', () => {
            expect(firstAction).toBeInstanceOf(Function);
            expect(firstAction.type).toBeDefined();
            expect(firstAction.error).toBeDefined();
            expect(firstAction.success).toBeDefined();
            expect(firstAction.request).toBeDefined();
            expect(firstAction.reset).toBeDefined();
            expect(firstAction.load).toBeDefined();
            expect(firstAction.withParams).toBeDefined();
        });

        it('should create data reducer', () => {
            expect(getActionData(firstAction, store.getState())).toEqual([]);
            expect(getActionData(secondAction, store.getState())).toEqual(null);
        });

        it('should create meta reducer', () => {
            expect(getActionMeta(firstAction, store.getState()).pending).toBeDefined();
            expect(getActionMeta(firstAction, store.getState()).pending).toEqual(false);
            expect(getActionMeta(secondAction, store.getState()).error).toBeDefined();
            expect(getActionMeta(secondAction, store.getState()).error).toEqual(false);
        });

        it('should create saga', () => {
            expect(getAsyncSagas().length).toEqual(2);
        });

        it('should create noParamsReducer', () => {
            expect(customReducer).toBeInstanceOf(Function);
        });

        it('should return state with filtered [__NO_PARAMS__]', () => {
            const action = { type: 'SECOND_ACTION' };
            const state = { [noParamsKey]: [1,2] };

            expect(customReducer({[noParamsKey]: [1,2,3]}, action)).toEqual(state);
        });
    });

    describe('createSaga()', () => {
        it('should create saga', () => {
            const saga = createSaga(firstAction);

            expect(saga).toBeInstanceOf(Object);
        });
    });

    describe('createHttpReducer()', () => {
        const reducer = createHttpReducer(FIRST_ACTION);

        it('should return state on success', () => {
            const action = {
                type: toSuccess(FIRST_ACTION),
                payload: { id: 3 }
            };
            const state = {
                [noParamsKey]: { id: 3 }
            };

            expect(reducer({}, action)).toEqual(state);
        });

        it('should return state on success with params', () => {
            const action = {
                type: toSuccess(FIRST_ACTION),
                payload: { id: 3 },
                params: {
                    storeBy: 45,
                    state: 'open'
                }
            };
            const id = getPath(action.params);
            const state = { [id]: { id: 3 }};

            expect(reducer({}, action)).toEqual(state);
        });

        it('should return state on reset', () => {
            const action = {
                type: toReset(FIRST_ACTION)
            };
            const state = {[noParamsKey]: {}};

            expect(reducer(state, action)).toEqual({});
        });

        it('should return state on reset with params', () => {
            const action = {
                type: toReset(FIRST_ACTION),
                params: {
                    storeBy: 45,
                    state: 'open'
                }
            };
            const id = getPath(action.params);
            const state = { [id]: {} };

            expect(reducer(state, action)).toEqual({});
        });
    });

    describe('createHttpReducer() with custom reducer', () => {
        const CUSTOM_ACTION = 'CUSTOM_ACTION';
        const customReducer = (state, action, defaultReducer) => {
            switch (action.type) {
                case CUSTOM_ACTION:
                    return {
                        ...state,
                        custom: action.payload
                    };
                default:
                    return defaultReducer(state, action);
            }
        }
        const reducer = createHttpReducer(FIRST_ACTION, {}, customReducer);

        it('should handle custom action with custom reducer', () => {
            const action = {
                type: CUSTOM_ACTION,
                payload: 'custom payload'
            };
            const state = {
                'custom': 'custom payload'
            }
            expect(reducer({}, action)).toEqual(state);
        });

        it('should call defaultReducer', () => {
            const action = {
                type: toSuccess(FIRST_ACTION),
                payload: { id: 3 }
            };
            const state = {
                [noParamsKey]: { id: 3 }
            };

            expect(reducer({}, action)).toEqual(state);
        });
    });

    describe('createMetaReducer()', () => {
        const metaReducer = createMetaReducer(FIRST_ACTION);

        it('should return state on pending', () => {
            const action = {
                type: toRequest(FIRST_ACTION)
            };
            const state = {
                [noParamsKey]: { pending: true, success: false, error: false, lastSucceedAt: null }
            };

            expect(metaReducer({}, action)).toEqual(state);
        });

        it('should return state on pending with params', () => {
            const action = {
                type: toRequest(FIRST_ACTION),
                params: {
                    storeBy: 45,
                    state: 'open'
                }
            };
            const id = getPath(action.params);
            const state = { [id]: { pending: true, success: false, error: false, lastSucceedAt: null } };

            expect(metaReducer({}, action)).toEqual(state);
        });

        it('should return state on error', () => {
            const action = {
                type: toError(FIRST_ACTION),
                payload: 'error'
            };
            const state = {
                [noParamsKey]: { pending: false, success: false, error: 'error', lastSucceedAt: null }
            };

            expect(metaReducer({}, action)).toEqual(state);
        });

        it('should return state on error with params', () => {
            const action = {
                type: toError(FIRST_ACTION),
                payload: 'error',
                params: {
                    storeBy: 45,
                    state: 'open'
                }
            };
            const id = getPath(action.params);
            const state = { [id]: { pending: false, success: false, error: 'error', lastSucceedAt: null } };

            expect(metaReducer({}, action)).toEqual(state);
        });

        it('should change on load', () => {
            const date = (new Date).toISOString();
            const action = {
                type: toLoad(FIRST_ACTION),
                payload: {},
                attrs: {
                    lastSucceedAt: date
                }
            };

            const state = { [noParamsKey]: { lastSucceedAt: date } };

            expect(metaReducer({}, action)).toEqual(state);
        });
    });
});
