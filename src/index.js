import { combineReducers } from 'redux';
import { head, is, isEmpty, mapObjIndexed, pickAll } from 'ramda';
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

    newAction.selectData = (state, props) => getActionData(newAction, state, props);
    newAction.selectMeta = (state, props) => getActionMeta(newAction, state, props);

    return newAction;
};

function configAsyncAction(actionName, handler, initialState, taker, customReducer, customSagaGenerator) {
    const action = createAction(actionName);
    const dataReducer = createHttpReducer(actionName, initialState, customReducer);
    const metaReducer = createMetaReducer(actionName);
    const saga = createSaga(customSagaGenerator, taker)(action);

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

function createAsyncAction(...args) {
    const action = head(args);

    if (is(String, action)) {
        return configAsyncAction(...args);
    } else {
        return configAsyncAction(
            action.actionName,
            action.handler,
            action.initialState,
            action.taker,
            action.customReducer,
            action.customSagaGenerator,
        );
    }
}

export { createAsyncAction, getAsyncSagas, getAsyncReducers, noParamsReducer };
export { noParamsKey, defaultKey };
export { withAsyncActions } from './withAsyncActions';
export { withAsyncHandlers } from './withAsyncHandlers';
export { withSagas } from './withSagas';
export { asyncConnect } from './asyncConnect';
export { SagaProvider } from './SagaProvider';
export {
    toLoad,
    toError,
    toRequest,
    toSuccess,
    toReset,
    createAction
} from './actionHelpers';
export * from './utils/saga';
export * from './utils/doAction';
