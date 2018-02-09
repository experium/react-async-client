import { assoc, prop } from 'ramda';

import configureStore from '../test-utils/configureStore';
import { createPromise } from '../test-utils/promiseHandlers';
import {
    createAsyncAction,
    asyncTakeFirst,
    takeOnce,
    createTaker
} from '../../src/index';

const REFRESH = 'REFRESH';
const refreshHandler = jest.fn(({ payload }) => {
    return payload;
});
const refresh = createAsyncAction(REFRESH, refreshHandler, {}, asyncTakeFirst);


const REFRESH_ONCE = 'REFRESH_ONCE';
const refreshOnceHandler = jest.fn(({ payload }) => {
    return payload;
});
const refreshOnce = createAsyncAction(REFRESH_ONCE, refreshOnceHandler, {}, takeOnce);

const REFRESH_ONCE_CONTROLLED = 'REFRESH_ONCE_CONTROLLED';
const refreshOnceControlledHandler = jest.fn(({ payload }) => {
    return payload;
});
const controlledParams = [];
const controlledTakeOnce = createTaker(prop('type'), false, controlledParams);
const refreshOnceControlled = createAsyncAction(REFRESH_ONCE_CONTROLLED, refreshOnceControlledHandler, {}, controlledTakeOnce);

const setup = () => {
    const store = configureStore({});

    return {
        store
    };
};

describe('utils/saga (takeFirst)', () => {
    const { store } = setup();

    it('takeFirst call once', async () => {
        const requestFirst = createPromise(1);
        const requestSecond = createPromise(2);

        store.dispatch(refresh(requestFirst.promise));
        store.dispatch(refresh(requestSecond.promise));

        requestFirst.resolve();
        requestSecond.resolve();
        await requestFirst.promise.then();

        expect(refreshHandler).toHaveBeenCalledTimes(1);
        expect(refresh.selectData(store.getState())).toEqual(1);
    });

    it('takeFirst call again after complete first pool', async () => {
        const requestNext = createPromise(1);
        store.dispatch(refresh(requestNext));

        requestNext.resolve();
        await requestNext.promise.then();

        expect(refreshHandler).toHaveBeenCalledTimes(2);
    });

    it('takeFirst call twice with different params', async () => {
        const requestWithFirstParam = refresh.withParams('first');
        const requestWithSecondParam = refresh.withParams('second');
        const requestFirst = createPromise(3);
        const requestSecond = createPromise(4);

        store.dispatch(
            assoc('params', 'first', requestWithFirstParam(requestFirst.promise))
        );
        store.dispatch(
            assoc('params', 'second', requestWithSecondParam(requestSecond.promise))
        );

        requestFirst.resolve();
        requestSecond.resolve();
        await requestFirst.promise.then();
        await requestSecond.promise.then();

        expect(refreshHandler).toHaveBeenCalledTimes(4);
    });

    it('takeOnce call once', async () => {
        const request = createPromise(1);
        store.dispatch(refreshOnce(request));
        request.resolve();
        await request.promise.then();

        const requestSkipped = createPromise(1);
        store.dispatch(refreshOnce(requestSkipped));
        requestSkipped.resolve();
        await requestSkipped.promise.then();

        expect(refreshOnceHandler).toHaveBeenCalledTimes(1);
    });

    it('controlled takeOnce call again after reset', async () => {
        const request = createPromise(1);
        store.dispatch(refreshOnceControlled(request));
        request.resolve();
        await request.promise.then();

        const requestSkipped = createPromise(1);
        store.dispatch(refreshOnceControlled(requestSkipped));
        requestSkipped.resolve();
        await requestSkipped.promise.then();

        controlledParams.length = 0;

        const requestNext = createPromise(1);
        store.dispatch(refreshOnceControlled(requestNext));
        requestNext.resolve();
        await requestNext.promise.then();

        expect(refreshOnceControlledHandler).toHaveBeenCalledTimes(2);
    });

});
