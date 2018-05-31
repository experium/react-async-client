import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import { createPromise } from './test-utils/promiseHandlers';
import configureStore, { sagaMiddleware } from './test-utils/configureStore';
import {
    createAsyncAction,
    withAsyncActions,
    SagaProvider,
    doAction,
} from '../src/index';

const Component = () => null;

const setup = AsyncComponent => {
    const store = configureStore({});
    const wrapper = mount(
        <SagaProvider sagaMiddleware={sagaMiddleware}>
            <Provider store={store}>
                <AsyncComponent />
            </Provider>
        </SagaProvider>
    );

    return { wrapper, store };
};

describe('configAsyncAction', () => {
    const actionHandler = jest.fn();

    const configuratedAction = createAsyncAction({
        actionName: 'ACTION',
        handler: ({ payload }) => {
            actionHandler();

            return payload;
        },
        customSagaGenerator: function*(actionFn, action) {
            yield* doAction(action);
        }
    });

    describe('should use customSagaGenerator', () => {
        const ComponentWithHandlers = withAsyncActions({ configuratedAction })(
            Component
        );

        const { wrapper } = setup(ComponentWithHandlers);
        const component = wrapper.find(Component);

        it('should handle withSuccessHandler()', async () => {
            const defer = createPromise(null);
            component.props().configuratedAction.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(actionHandler).toHaveBeenCalled();
        });
    });
});
