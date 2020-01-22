import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import configureStore from '../test-utils/configureStore';
import { createPromise } from '../test-utils/promiseHandlers';
import { createAsyncAction, withAsyncActions, withAsyncHandlers, SagaProvider } from '../../src/index';

const ACTION = 'ACTION';

const Component = (props) => {
    const { action } = props;

    return (
        <div>{ action ? action.data : null }</div>
    );
};
const PropsProviderComponent = ({ store, sagaMiddleware, AsyncComponent, ...props}) => (
    <SagaProvider sagaMiddleware={sagaMiddleware}>
        <Provider store={store}>
            <AsyncComponent {...props} />
        </Provider>
    </SagaProvider>
);

const setup = (props = {}, AsyncComponent) => {
    const { store, sagaMiddleware } = configureStore({});
    const wrapper = mount(
        <PropsProviderComponent
            store={store}
            sagaMiddleware={sagaMiddleware}
            {...props}
            AsyncComponent={AsyncComponent}
        />
    );

    return { wrapper, store };
};

describe('Async Client withHandlers HOC', () => {
    const actionHandler = ({ payload }) => {
        return payload || null;
    };
    const asyncAction = createAsyncAction(ACTION, actionHandler, []);
    const actionData = '1';
    const pendingHandler = jest.fn();
    const errorHandler = jest.fn();
    const successHandler = jest.fn();

    const setupComponent = (Component) => setup({}, Component);
    const metaHandler = handler => (props, action) => handler(props, action);

    describe('withAsyncHandlers({ metaHandler })', () => {
        const ComponentWithHandlers = withAsyncActions({ action: asyncAction })(withAsyncHandlers({
            action: {
                successHandler: metaHandler(successHandler),
                errorHandler: metaHandler(errorHandler),
                pendingHandler: metaHandler(pendingHandler),
            }
        })(Component));

        const { wrapper } = setupComponent(ComponentWithHandlers);
        const component = wrapper.find(Component);

        it('should handle withSuccessHandler()', async () => {
            const defer = createPromise(actionData);
            component.props().action.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(successHandler).toHaveBeenCalledTimes(1);
            expect(successHandler).lastCalledWith(
                expect.objectContaining({
                    action: expect.objectContaining({
                        meta: expect.objectContaining({
                            pending: false,
                            success: true,
                            error: false,
                        }),
                    })
                }),
                expect.objectContaining({
                    requestAction: expect.objectContaining({
                        payload: expect.anything(),
                    })
                })
            );
        });

        it('should handle withPendingHandler()', async () => {
            expect(pendingHandler).toHaveBeenCalledTimes(1);
            expect(pendingHandler).lastCalledWith(
                expect.objectContaining({
                    action: expect.objectContaining({
                        meta: expect.objectContaining({
                            pending: true,
                            success: false,
                            error: false,
                        }),
                    })
                }),
                expect.anything()
            );
        });

        it('should handle withErrorHandler()', async () => {
            const defer = createPromise(null, 'error');
            component.props().action.dispatch(defer.promise);

            defer.reject();
            try {
                await defer.promise.catch();
            } catch(e) {
                expect(errorHandler).toHaveBeenCalledTimes(1);
                expect(errorHandler).lastCalledWith(
                    expect.objectContaining({
                        action: expect.objectContaining({
                            meta: expect.objectContaining({
                                pending: false,
                                success: false,
                                error: expect.anything(),
                            }),
                        })
                    }),
                    expect.objectContaining({
                        requestAction: expect.objectContaining({
                            payload: expect.anything(),
                        })
                    })
                );
            }
        });

        it('should pass action to handler', async () => {
            component.props().action.dispatch('action_payload');
            expect(pendingHandler).lastCalledWith(
                expect.anything(),
                expect.objectContaining({
                    requestAction: expect.objectContaining({
                        payload: 'action_payload',
                    })
                })
            );
        });
    });

    describe('withAsyncHandlers({ metaHandler })', () => {
        const handler = jest.fn();

        const ComponentWithParamsHandlers = withAsyncActions({
            action: asyncAction.withParams('params')
                .withSuccessHandler(handler)
        })(() => null);

        const ComponentWithNoparamsHandlers = withAsyncActions({
            action: asyncAction.withParams(() => ({ id: '1' }))
                .withSuccessHandler(handler)
        })(props => (
            <div>
                <Component {...props} />
                <ComponentWithParamsHandlers />
            </div>
        ));

        const { wrapper } = setupComponent(ComponentWithNoparamsHandlers);
        const paramsComponent = wrapper.find(Component);


        it('should not handle withSuccessHandler() with other params', async () => {
            const defer = createPromise(actionData);
            paramsComponent.props().action.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe('withAsyncHandlers with no actions', () => {
        const ComponentWithoutActions = withAsyncHandlers({
            action: {
                successHandler: metaHandler(successHandler),
                errorHandler: metaHandler(errorHandler),
                pendingHandler: metaHandler(pendingHandler),
            }
        })(Component);


        it('should no error', async () => {
            const { wrapper } = setupComponent(ComponentWithoutActions);
            const component = wrapper.find(Component);

            expect(component.props().action).toBeFalsy();
        });

    });
});
