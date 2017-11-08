import { assoc } from 'ramda';

import configureStore from '../test-utils/configureStore';
import { createPromise } from '../test-utils/promiseHandlers';
import {
    createAsyncAction,
    asyncTakeFirst
} from '../../src/index';

const REFRESH = 'REFRESH';
const refreshHandler = jest.fn(({ payload }) => {
    return payload;
});
const refresh = createAsyncAction(REFRESH, refreshHandler, {}, asyncTakeFirst);

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
});
