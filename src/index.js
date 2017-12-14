import { combineReducers } from 'redux';
import { isEmpty, mapObjIndexed, pickAll } from 'ramda';
import { capitalize } from './utils/ramdaAdditions';

import { createAction } from './actionHelpers';
import { getActionData, getActionMeta, noParamsKey, defaultKey } from './asyncHelpers';
import { setActionHandler } from './utils/doAction';
import noParamsReducer from './noParamsReducer';
import createHttpReducer from './createHttpReducer';
import createMetaReducer from './createMetaReducer';
import createSaga from './createSaga';

let sagas = [];
let dataReducers = {};
let metaReducers = {};

const getDefaultConfig = pickAll([
    'params',
    'defaultPayload',
    'options',
    'shouldUpdate',
    'successHandler',
    'errorHandler',
    'pendingHandler',
    'saga',
]);

const createConfigurableAction = (action, config = {}) => {
    const newAction = createAction(action.type);

    const newConfig = {
        ...getDefaultConfig(action),
        ...config
    };

    function withConfig(name) {
        return function (value) {
            return createConfigurableAction(newAction, { [name]: value });
        }
    }

    mapObjIndexed((value, key) => {
        newAction[key] = value;
        const withKey = 'with' + capitalize(key);
        newAction[withKey] = withConfig(key);
    }, newConfig);
    // @deprecated
    newAction.withPayload = newAction.withDefaultPayload;

    newAction.selectData = (state) => getActionData(newAction, state);
    newAction.selectMeta = (state) => getActionMeta(newAction, state);

    return newAction;
};

function createAsyncAction(actionName, handler, initialState, taker, customReducer) {
    const action = createAction(actionName);
    const dataReducer = createHttpReducer(actionName, initialState, customReducer);
    const metaReducer = createMetaReducer(actionName);
    const saga = createSaga(action, taker);

    setActionHandler(actionName, handler);

    dataReducers[actionName] = dataReducer;
    metaReducers[actionName] = metaReducer;
    sagas.push(saga);

    return createConfigurableAction(action);
}

function getAsyncSagas() {
    return sagas;
}

function getAsyncReducers() {
    return !isEmpty(dataReducers) && {
        asyncClient: combineReducers({
            data: combineReducers(dataReducers),
            meta: combineReducers(metaReducers)
        })
    };
}

export { createAsyncAction, getAsyncSagas, getAsyncReducers, noParamsReducer };
export { noParamsKey, defaultKey };
export { withAsyncActions } from './withAsyncActions';
export { withAsyncHandlers } from './withAsyncHandlers';
export { withSagas } from './withSagas';
export {
    toError,
    toRequest,
    toSuccess,
    toReset,
    createAction
} from './actionHelpers';
export * from './utils/saga'
