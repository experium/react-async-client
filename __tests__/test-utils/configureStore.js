import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import { getAsyncReducers, getAsyncSagas } from '../../src';

export default function configureStore(initialState = {}) {
    const sagaMiddleware = createSagaMiddleware();
    const middlewares = [sagaMiddleware];

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

    return {
        store,
        sagaMiddleware,
    };
};
