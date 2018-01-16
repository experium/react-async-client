import { toSuccess, toReset, toError, toRequest, toLoad } from './actionHelpers';
import { getPath, noParamsKey, defaultKey } from './asyncHelpers';
import { assoc, assocPath, pathOr } from 'ramda';

const defaultState = { pending: false, error: false, success: false, lastSucceedAt: null };

export default function createMetaReducer(actionName) {
    return (state = { [defaultKey]: defaultState }, { type, payload, params, attrs = {}, requestAction }) => {
        const param = pathOr(params || noParamsKey, ['params'], requestAction);
        const getLastSucceedAt = () => pathOr(null, [getPath(param), 'lastSucceedAt'], state);

        const getState = (pending, error, success, lastSucceedAt = getLastSucceedAt()) => {
            const meta = { pending, error, success, lastSucceedAt };
            return assoc(getPath(param), meta, state);
        };

        switch(type) {
            case toRequest(actionName):
                return getState(true, false, false);
            case toSuccess(actionName):
                return getState(false, false, true, (new Date).toISOString());
            case toError(actionName):
                return getState(false, payload, false);
            case toReset(actionName):
                return getState(false, false, false, null);
            case toLoad(actionName):
                const updateState = assocPath([getPath(param), 'lastSucceedAt'], attrs.lastSucceedAt);
                return !getLastSucceedAt() || attrs.force ? updateState(state) : state;
            default:
                return state;
        }
    };
}
