import { createAction, toReset, toRequest, toSuccess, toError, asError, asRequest, asSuccess, asReset } from '../src/actionHelpers';

describe('actionHelpers', () => {
    describe('createAction', () => {
        it('createAction with type, attrs and payload', () => {
            const type = 'MOCK_ACTION_TYPE';
            const payload = { foo: { bar: 'mock' } };
            const attrs = { url: 'https://mock.com' };
            const expectedAction = {
                type,
                payload,
                attrs
            };
            const resAction = createAction(type)(payload, attrs);
            expect(resAction).toEqual(expectedAction);
        });

        it('createAction with type, attrs and static payload', () => {
            const type = 'MOCK_ACTION_TYPE';
            const staticPayload = { foo: { bar: 'mock' } };
            const attrs = { url: 'https://mock.com' };
            const expectedAction = {
                type,
                payload: staticPayload,
                attrs
            };
            const resAction = createAction(type, staticPayload)(null, attrs);
            expect(resAction).toEqual(expectedAction);
        });

        it('createAction without attrs and payload', () => {
            const type = 'MOCK_ACTION_TYPE';
            const expectedAction = {
                type,
                payload: null,
                attrs: undefined
            };
            const resAction = createAction(type)();
            expect(resAction).toEqual(expectedAction);
        });

        it('createAction with checking statuses', () => {
            const type = 'MOCK_ACTION_TYPE';
            const expectedAction = {
                type,
                payload: null,
                attrs: undefined
            };
            const actionCreator = createAction(type);
            expect(actionCreator.error()).toEqual({ ...expectedAction, type: `${type}_ERROR`, });
            expect(actionCreator.request()).toEqual({ ...expectedAction, type: `${type}_REQUEST`, });
            expect(actionCreator.success()).toEqual({ ...expectedAction, type: `${type}_SUCCESS`, });
            expect(actionCreator.reset()).toEqual({ ...expectedAction, type: `${type}_RESET`, });
            expect(actionCreator.type).toEqual(`${type}`);
        });
    });

    it('type appenders', () => {
        const type = 'MOCK_ACTION_TYPE';
        expect(toError(type)).toEqual(`${type}_ERROR`);
        expect(toRequest(type)).toEqual(`${type}_REQUEST`);
        expect(toSuccess(type)).toEqual(`${type}_SUCCESS`);
        expect(toReset(type)).toEqual(`${type}_RESET`);
    });

    it('type status setters', () => {
        const type = 'MOCK_ACTION_TYPE';
        const action = { type };
        expect(asError(action)).toEqual({ type: `${type}_ERROR` });
        expect(asRequest(action)).toEqual({ type: `${type}_REQUEST` });
        expect(asSuccess(action)).toEqual({ type: `${type}_SUCCESS` });
        expect(asReset(action)).toEqual({ type: `${type}_RESET` });
    });
});
