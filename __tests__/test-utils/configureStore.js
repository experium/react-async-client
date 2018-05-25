import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import { getAsyncReducers, getAsyncSagas } from '../../src';

export const sagaMiddleware = createSagaMiddleware();
const middlewares = [sagaMiddleware];

export default function configureStore(initialState = {}) {
    const store = createStore(
        combineReducers({
            ...getAsyncReducers(),
            user: (state = null) => state,
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
