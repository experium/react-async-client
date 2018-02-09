import { fork, call } from 'redux-saga/effects';
import { contains, prop } from 'ramda';
import { takeEvery } from 'redux-saga';

export const createTaker = (storedBy, removeOnSuccess = true, takedParams = []) => function* (pattern, saga, ...args) {
    const task = yield fork(function*() {
        yield takeEvery(pattern, function* (action) {
            const params = storedBy(action);

            if (!contains(params, takedParams)) {
                takedParams.push(params);

                try {
                    yield call(saga, ...args.concat(action));
                    if (removeOnSuccess) {
                        takedParams.splice(takedParams.indexOf(params), 1);
                    }
                } catch (e) {
                    takedParams.splice(takedParams.indexOf(params), 1);
                }
            }
        })
    });

    return task;
}

export const takeOnce = createTaker(prop('params'), false);
export const takeFirst = createTaker(prop('type'));
export const asyncTakeFirst = createTaker(prop('params'));

var middleware = null;

export function setSagaMiddleware(sagaMiddleware) {
    middleware = sagaMiddleware;
}

export function runSaga(saga, ...args) {
    if (!middleware) {
        throw new Error('Before running a Saga, you must set the Saga middleware using setSagaMiddleware');
    }
    return middleware.run(saga, ...args);
}
