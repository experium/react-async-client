import { put, select } from 'redux-saga/effects';
import { compose, merge } from 'ramda';

import { asRequest, asError, asSuccess } from '../actionHelpers';
import { getPath, noParamsKey, selectActionMeta } from '../asyncHelpers';
import { doAction } from './doAction';

export const createRequestCacheGenerator = ({ getItem, setItem }) => {
    return function* (actionFn, action) {
        const path = getPath(action.params || noParamsKey);
        actionFn = compose(
            merge({ requestAction: action }),
            actionFn
        );

        try {
            yield put(asRequest(actionFn(null)));
            const response = yield* doAction(action);
            const lastSucceedAt = (new Date()).toISOString();

            yield put(asSuccess(actionFn(response, { lastSucceedAt })));

            setItem(`${action.type}/${path}`, {
                response,
                lastSucceedAt,
            });

            return { response };
        } catch (error) {
            try {
                const item = yield getItem(`${action.type}/${path}`);

                if (!item) {
                    throw new Error('Can\'t get item from cache');
                }

                const { response, lastSucceedAt } = item;
                const attrs = { error, lastSucceedAt };

                yield put(asSuccess(actionFn(response, attrs)));
            } catch (cacheError) {
                yield put(asError(actionFn(error)));
            }

            return { error };
        }
    };
};
