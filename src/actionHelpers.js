import evolve from 'ramda/src/evolve';
import concat from 'ramda/src/concat';
import compose from 'ramda/src/compose';
import __ from 'ramda/src/__';

export const toError = concat(__, '_ERROR');
export const toRequest = concat(__, '_REQUEST');
export const toSuccess = concat(__, '_SUCCESS');
export const toReset = concat(__, '_RESET');

const setStatus = statusFn => evolve({ type: statusFn });

export const asError = setStatus(toError);
export const asRequest = setStatus(toRequest);
export const asSuccess = setStatus(toSuccess);
export const asReset = setStatus(toReset);

export const createAction = (type, staticPayload) => {
    function action(payload = null, attrs = null) {
        return {
            type,
            payload: staticPayload || payload,
            attrs
        };
    };

    action.type = type;
    action.error = compose(asError, action);
    action.request = compose(asRequest, action);
    action.success = compose(asSuccess, action);
    action.reset = compose(asReset, action);

    action.errorType = toError(type);
    action.requestType = toRequest(type);
    action.successType = toSuccess(type);
    action.resetType = toReset(type);

    return action;
};
