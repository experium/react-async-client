import { put, delay } from 'redux-saga/effects';

import { requestGenerator } from '../../src/utils/redux';
import { doAction, setActionHandler } from '../../src/utils/doAction';
import { createAction } from '../../src/actionHelpers';

const LOGIN = 'LOGIN';
const login = createAction(LOGIN);
setActionHandler(LOGIN, function*() {
    return yield delay(1);
})

describe('utils/redux (requestGenerator)', () => {
    it('requestGenerator success', () => {
        const actionFn = createAction(LOGIN);
        const action = login({}, { url: '/login' });
        const generator = requestGenerator(actionFn, action);

        const requestAction = {
            type: LOGIN + '_REQUEST',
            attrs: null,
            payload: null,
            requestAction: action
        };
        expect(generator.next().value).toEqual(put(requestAction));
        expect(generator.next().value).toEqual(doAction(action).next().value);

        const mockedResponse = { foo: 'bar' };
        const responseAction = {
            type: LOGIN + '_SUCCESS',
            attrs: null,
            payload: mockedResponse,
            requestAction: action
        };
        expect(generator.next(mockedResponse).value).toEqual(put(responseAction));
        expect(generator.next().value).toEqual({ response: mockedResponse });
    });

    it('requestGenerator error', () => {
        const actionFn = createAction(LOGIN);
        const action = login({}, { url: '/login' });
        const generator = requestGenerator(actionFn, action);

        const requestAction = {
            type: LOGIN + '_REQUEST',
            attrs: null,
            payload: null,
            requestAction: action
        };
        expect(generator.next().value).toEqual(put(requestAction));
        expect(generator.next().value).toEqual(doAction(action).next().value);

        const error = new Error('mocked error');
        const errorResponseAction = {
            type: LOGIN + '_ERROR',
            attrs: null,
            payload: error,
            requestAction: action
        };
        expect(generator.throw(error).value).toEqual(put(errorResponseAction));
        expect(generator.next().value).toEqual({ error });
    });

    it('requestGenerator error caused by invalid action', () => {
        const actionFn = createAction(LOGIN);
        const action = {};
        const generator = requestGenerator(actionFn, action);

        const requestAction = {
            type: LOGIN + '_REQUEST',
            attrs: null,
            payload: null,
            requestAction: action
        };
        expect(generator.next().value).toEqual(put(requestAction));
        try {
            doAction(action).next();
        } catch(error) {
            const errorResponseAction = {
                type: LOGIN + '_ERROR',
                attrs: null,
                payload: error,
                requestAction: action
            };
            expect(generator.next().value).toEqual(put(errorResponseAction));
            expect(generator.next().value).toEqual({ error });
        }
    });
});
