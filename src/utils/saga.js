import { fork, call, takeEvery } from 'redux-saga/effects';
import { contains, prop } from 'ramda';

export const createTaker = (storedBy, removeOnSuccess = true, takedParams = []) => function* (pattern, saga, ...args) {
    const task = yield fork(function*() {
        yield takeEvery(pattern, function* (action) {
            const params = storedBy(action);

            if (!contains(params, takedParams)) {
                takedParams.push(params);

                try {
                    const result = yield call(saga, ...args.concat(action));

                    if (removeOnSuccess || prop('error', result)) {
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

export function runSaga(middleware, saga, ...args) {
    if (!middleware) {
        throw new Error('Before running a Saga, you must set the Saga middleware in <SagaProvider />');
    }
    return middleware.run(saga, ...args);
}
