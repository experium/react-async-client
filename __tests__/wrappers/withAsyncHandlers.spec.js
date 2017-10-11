import React from 'react';
import { mount } from 'enzyme';
import { Provider, connect } from 'react-redux';

import configureStore from '../test-utils/configureStore';
import { createAsyncAction, withAsyncActions, withAsyncHandlers } from '../../src/index';

const ACTION = 'ACTION';

const createPromise = (data, error) => {
    let resolve, reject;
    const promise = new Promise((resolver, rejector) => {
        resolve = () => resolver(data);
        reject = () => rejector(error);
    });

    return {
        resolve,
        reject,
        promise
    };
}

const Component = (props) => {
    const { action } = props;

    return (
        <div>{ action.data }</div>
    );
};
const PropsProviderComponent = ({ store, AsyncComponent, ...props}) => (
    <Provider store={store}>
        <AsyncComponent {...props} />
    </Provider>
);

const setup = (props = {}, AsyncComponent) => {
    const store = configureStore({});
    const wrapper = mount(
        <PropsProviderComponent
            store={store}
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

    const setupComponent = (Component) => setup({ pendingHandler, errorHandler, successHandler }, Component);
    const metaHandler = propName => ({ [propName] : handler }) => handler();

    describe('withAsyncHandlers({ metaHandler })', () => {
        const ComponentWithHandlers = withAsyncActions({ action: asyncAction })(withAsyncHandlers({
            action: {
                successHandler: metaHandler('successHandler'),
                errorHandler: metaHandler('errorHandler'),
                pendingHandler: metaHandler('pendingHandler'),
            }
        })(Component));

        const { wrapper } = setupComponent(ComponentWithHandlers);
        const component = wrapper.find(Component);

        it('should handle withSuccessHandler()', async () => {
            const defer = createPromise(actionData);
            component.props().action.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(component.props().successHandler).toHaveBeenCalledTimes(1);
        });

        it('should handle withErrorHandler()', async () => {
            const defer = createPromise(null, 'error');
            component.props().action.dispatch(defer.promise);

            defer.reject();
            try {
                await defer.promise.catch();
            } catch(e) {
                expect(component.props().errorHandler).toHaveBeenCalledTimes(1);
            }
        });

        it('should handle withPendingHandler()', async () => {
            expect(component.props().pendingHandler).toHaveBeenCalledTimes(2);
        });
    });
});
