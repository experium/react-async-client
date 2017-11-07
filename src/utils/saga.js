import { take, fork, join } from 'redux-saga/effects';
import { append, contains, not, prop, without } from 'ramda';

export const createTakeFirst = storedBy => function*(pattern, saga, ...args) {
    const task = yield fork(function*() {
        let takedParams = [];
        /* eslint-disable no-loop-func */
        while (true) {
            const action = yield take(pattern);
            const params = storedBy(action);

            if (not(contains(params, takedParams))) {
                takedParams = append(params, takedParams);
                const firstTask = yield fork(saga, ...args.concat(action));

                yield fork(function*() {
                    yield join(firstTask);
                    takedParams = without([params], takedParams);
                });
            }
        }
        /* eslint-enable no-loop-func */
    });

    return task;
}

export const takeFirst = createTakeFirst(prop('type'));
export const asyncTakeFirst = createTakeFirst(prop('params'));

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
