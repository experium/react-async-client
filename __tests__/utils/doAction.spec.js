import { call } from 'redux-saga/effects';

import { doAction, setActionHandler, setGeneratorActionHandler } from '../../src/utils/doAction';
import { createAction } from '../../src/actionHelpers';

describe('doAction', () => {
    it('setActionHandler', () => {
        const type = 'USER_ACTION';
        const handler = () => {};
        const action = createAction(type)({}, { url: 'test2' });

        setActionHandler(type, handler);
        expect(doAction(action).next().value).toEqual(call(handler, action));
    });

    it('setGeneratorActionHandler', () => {
        const type = 'USER_ACTION';
        const handler = () => {};
        const action = createAction(type)({ id: 1 }, { url: '/user' });

        setGeneratorActionHandler(type, function* userAction({ attrs, payload }) {
            return yield call(handler, attrs.url, { params: payload });
        });

        expect(doAction(action).next().value).toEqual(call(handler, '/user', { params: { id: 1 } }));
    });
});
