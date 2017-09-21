import { toSuccess, toReset, toError, toRequest } from './actionHelpers';
import { getPath, noParamsKey, defaultKey } from './asyncHelpers';
import { assoc, pathOr } from 'ramda';

const defaultState = { pending: false, error: false, success: false };

export default function createMetaReducer(actionName) {
    return (state = { [defaultKey]: defaultState }, { type, payload, params, requestAction }) => {
        const param = pathOr(params || noParamsKey, ['params'], requestAction);

        const getState = (pending, error, success) => {
            const meta = { pending, error, success };
            return assoc(getPath(param), meta, state);
        };

        switch(type) {
            case toRequest(actionName):
                return getState(true, false, false);
            case toSuccess(actionName):
                return getState(false, false, true);
            case toError(actionName):
                return getState(false, payload, false);
            case toReset(actionName):
                return getState(false, false, false);
            default:
                return state;
        }
    };
}
