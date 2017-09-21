import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import { getAsyncReducers, getAsyncSagas } from '../../src';

const sagaMiddleware = createSagaMiddleware();
const middlewares = [sagaMiddleware];

export default function configureStore(initialState = {}) {
    const store = createStore(
        combineReducers({
            ...getAsyncReducers()
        }),
        initialState,
        applyMiddleware(...middlewares)
    );

    sagaMiddleware.run(function* () {
        yield all([
            ...getAsyncSagas()
        ]);
    });

    return store;
};
