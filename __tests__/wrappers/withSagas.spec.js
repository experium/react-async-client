import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import configureStore from '../test-utils/configureStore';
import {
    createAsyncAction,
    withAsyncActions,
    withSagas,
    SagaProvider,
    toSuccess,
} from '../../src/index';
import { take, select} from 'redux-saga/effects';

const DELETE_ACTION = 'DELETE_ACTION';

const Component = (props) => {
    const { deleteAction } = props;

    return (
        <div>
            { deleteAction.meta.success ? (
                <span id="ready">ready</span>
             ) : (
                <span id="deleted">deleted</span>
             ) }
        </div>
    );
};
const PropsProviderComponent = ({ store, sagaMiddleware, AsyncComponent, ...props}) => (
    <SagaProvider sagaMiddleware={sagaMiddleware}>
        <Provider store={store}>
            <AsyncComponent {...props} />
        </Provider>
    </SagaProvider>
);

const setup = (props, AsyncComponent) => {
    const { store, sagaMiddleware } = configureStore({});
    const wrapper = mount(
        <PropsProviderComponent store={store} sagaMiddleware={sagaMiddleware} {...props} AsyncComponent={AsyncComponent}/>
    );

    return {
        wrapper,
        store
    };
};

describe('With Sagas HOC', () => {
    const deleteAction = createAsyncAction(DELETE_ACTION, ({ payload }) => payload, {});

    const setupComponent = (Component) => setup({}, Component);

    describe('withAsyncActions( action.withSaga )', () => {
        let fn = jest.fn();
        let actionFn = jest.fn();
        let notFn = jest.fn();
        let saga = function* (getProps) {
            fn(getProps());
            yield take(toSuccess(DELETE_ACTION));
            const state = yield select(deleteAction.selectData);
            actionFn(state);
            yield take('AFTER_UNMOUNT');
            notFn();
        };

        const deleteItem = saga;
        const ComponentWithSaga = withAsyncActions({
            deleteAction
        })(
            withSagas([deleteItem])(Component)
        );

        const { wrapper, store } = setupComponent(ComponentWithSaga);
        const component = wrapper.find(Component);

        it('should register saga with props on component mount', () => {
            expect(fn).toHaveBeenCalledWith(component.props());
        });

        it('should listen store actions and select store', () => {
            component.props().deleteAction.dispatch('asd');
            expect(actionFn).toHaveBeenCalledWith('asd');
        });

        it('should unregister saga on component unmount', () => {
            wrapper.unmount();
            store.dispatch({
                type: 'AFTER_UNMOUNT',
            });
            expect(notFn).toHaveBeenCalledTimes(0);
        })
    })
});
