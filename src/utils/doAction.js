import { call } from 'redux-saga/effects';

const handlers = {};

const reject = action => {
    throw Error({
        reason: `There is no handler for ${action.type}`,
        action
    });
};

export const setGeneratorActionHandler = (type, handler) => {
    handlers[type] = handler;
};

export const doAction = function*(action) {
    const handler = handlers[action.type] || reject;
    return yield* handler(action);
};

export const setActionHandler = (type, handler) => {
    setGeneratorActionHandler(type, function*(action) {
        return yield call(handler, action);
    });
};
