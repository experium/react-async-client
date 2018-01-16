import { toSuccess, toReset, toLoad } from './actionHelpers';
import { assoc, pathOr, omit } from 'ramda';

import { getPath, noParamsKey, defaultKey } from './asyncHelpers';

export default function createHttpReducer(actionName, defaultState = {}, customReducer = null) {
    const defaultReducer = (state = { [defaultKey]: defaultState }, { type, payload, params, attrs = {}, requestAction }) => {
        const path = getPath(pathOr(params || noParamsKey, ['params'], requestAction));
        const getState = payload => assoc(path, payload, state);

        switch (type) {
            case toSuccess(actionName):
                return getState(payload);
            case toReset(actionName):
                return omit([path], state);
            case toLoad(actionName):
                return !state[path] || attrs.force ? getState(payload) : state;
            default:
                return state;
        }
    };

    if (customReducer) {
        return (state, action) => customReducer(state, action, defaultReducer);
    }

    return defaultReducer;
}
