import { take, fork, join, select } from 'redux-saga/effects';
import { append, contains, not, prop, without, path } from 'ramda';
import { noParamsKey, getPath } from '../asyncHelpers';

export const createTakeFirst = (storedBy, takedParams = []) => function*(pattern, saga, ...args) {
    const task = yield fork(function*() {
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

export function* takeOnce(pattern, saga, ...args) {
    const task = yield fork(function*() {
        let onceTasks = [];
        /* eslint-disable no-loop-func */
        while (true) {
            const action = yield take(pattern);
            const params = prop('params', action);
            const pathName = getPath(params || noParamsKey);

            if (not(contains(params, onceTasks))) {
                const success = yield select(state => path(['asyncClient', 'meta', pattern, pathName, 'success'], state));
                onceTasks = append(params, onceTasks);

                if (success) {
                    return;
                }

                const onceTask = yield fork(saga, ...args.concat(action));
                yield fork(function*() {
                    const { error } = yield join(onceTask);
                    if (error) {
                        onceTasks = without([params], onceTasks);
                    }
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
