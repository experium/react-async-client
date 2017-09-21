import { take, fork, join } from 'redux-saga/effects';
import append from 'ramda/src/append';
import contains from 'ramda/src/contains';
import not from 'ramda/src/not';
import without from 'ramda/src/without';

export function* takeFirst(pattern, storedBy, saga, ...args) {
    const task = yield fork(function*() {
        let firstTasks = [];
        /* eslint-disable no-loop-func */
        while (true) {
            const action = yield take(pattern);
            const params = storedBy(action);
            if (not(contains(params, firstTasks))) {
                firstTasks = append(params, firstTasks);
                const firstTask = yield fork(saga, ...args.concat(action));
                yield fork(function*() {
                    const { error } = yield join(firstTask);
                    if (error) {
                        firstTasks = without([params], firstTasks);
                    }
                });
            }
        }
        /* eslint-enable no-loop-func */
    });

    return task;
}
