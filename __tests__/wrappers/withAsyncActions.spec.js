import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import configureStore from '../test-utils/configureStore';
import { createPromise } from '../test-utils/promiseHandlers';
import {
    createAsyncAction,
    withAsyncActions
} from '../../src/index';
import { take, select } from 'redux-saga/effects';

const FIRST_ACTION = 'FIRST_ACTION';
const SECOND_ACTION = 'SECOND_ACTION';
const THIRD_ACTION = 'THIRD_ACTION';

const firstLoader = 'Loading 1';
const secondLoader = 'Loading 2';
const emptyDispatch = 'Empty dispatch';

const Component = (props) => {
    const { firstAction: first, secondAction: second } = props;

    return (
        <div>
            { first.meta.pending && <span id="first">{ firstLoader }</span> }
            { first.meta.success && <span id="first">{first.data}</span> }
            { first.meta.error && <span id="first">{first.meta.error}</span> }

            { second && second.meta.pending && <span id="second">{ secondLoader }</span> }
            { second && second.meta.success && <span id="second">{second.data}</span> }
            { second && second.meta.error && <span id="second">{second.meta.error}</span> }
        </div>
    );
};
const PropsProviderComponent = ({ store, AsyncComponent, ...props}) => (
    <Provider store={store}>
        <AsyncComponent {...props} />
    </Provider>
);

const setup = ({first, second, action, ...props} = {}, AsyncComponent, store = configureStore({})) => {
    const wrapper = mount(
        <PropsProviderComponent store={store} first={first} second={second} action={action} {...props} AsyncComponent={AsyncComponent}/>
    );

    return {
        wrapper,
        store
    };
};

describe('With Async Client HOC', () => {
    const firstAction = createAsyncAction(FIRST_ACTION, ({ payload }) => payload || emptyDispatch, []);
    const secondAction = createAsyncAction(SECOND_ACTION, ({ payload }) => payload, null);
    const thirdAction = createAsyncAction(THIRD_ACTION, ({ payload }) => payload, null);
    const firstData = '1';
    const secondData = '2';
    const action = jest.fn();

    const setupComponent = (Component, store) => setup({first: firstData, second: secondData, action}, Component, store);

    describe('withAsyncActions() renders', () => {
        const createAndSetupComponent = (actions) => {
            let rendersCount = 0;

            const { store } = setupComponent(withAsyncActions(actions)(() => {
                ++rendersCount;

                return null;
            }));

            const getRendersCount = () => rendersCount;

            return {
                store,
                getRendersCount
            };
        }

        it('should not call extra render', () => {
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction,
            });
            store.dispatch(secondAction());
            expect(getRendersCount()).toEqual(1);
        });

        it('should connect only data', () => {
            const firstActionOnlyData = firstAction.withOptions({
                connectMeta: false
            });
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction: firstActionOnlyData,
            });
            store.dispatch(firstActionOnlyData());
            expect(getRendersCount()).toEqual(2);
        });

        it('should connect only meta', () => {
            const firstActionOnlyMeta = firstAction.withOptions({
                connectData: false
            });
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction: firstActionOnlyMeta,
            });
            store.dispatch(firstActionOnlyMeta());
            expect(getRendersCount()).toEqual(3);
        });

        it('should connect data and meta', () => {
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction,
            });
            store.dispatch(firstAction());
            expect(getRendersCount()).toEqual(3);
        });

        it('should skip extra render', () => {
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction: firstAction.withOptions({
                    dispatchOnMount: true,
                    skipExtraRender: true,
                }),
            });
            store.dispatch(firstAction());
            expect(getRendersCount()).toEqual(3);
        });

        it('should not skip extra render', () => {
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction: firstAction.withOptions({
                    dispatchOnMount: true,
                    skipExtraRender: false,
                }),
            });
            store.dispatch(firstAction());
            expect(getRendersCount()).toEqual(4);
        });
    });

    describe('withAsyncActions({}) manual dispatch actions', () => {
        const ComponentWithAsync = withAsyncActions({
            firstAction,
            secondAction: secondAction.withPayload(props => props.second)
        })(Component);

        const { wrapper, store } = setupComponent(ComponentWithAsync);
        const component = wrapper.find(Component);

        it('should no render', () => {
            expect(component.find('#first').length).toEqual(0);
        });

        it('should render pending', () => {
            const defer = createPromise();
            component.props().firstAction.dispatch(defer.promise);

            expect(component.find('#first').text()).toEqual(firstLoader);
        });

        it('should render data', async () => {
            const defer = createPromise(firstData);
            component.props().firstAction.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(component.find('#first').text()).toEqual(firstData);
        });

        it('should set error', async () => {
            const firstError = 'error 1';
            const defer = createPromise(null, firstError);
            component.props().firstAction.dispatch(defer.promise);

            defer.reject();
            try {
                await defer.promise.catch();
            } catch(e) {
                expect(component.find('#first').text()).toEqual(firstError);
            }
        });

        it('should render reset data', () => {
            component.props().firstAction.reset();

            expect(component.find('#first').length).toEqual(0);
        });

        it('should dispatch with default payload', () => {
            component.props().secondAction.refresh();
            const state = store.getState();

            expect(secondAction.selectData(state)).toEqual(secondData);
        });


        it('should load data', () => {
            const date = (new Date).toISOString();
            component.props().secondAction.reset();
            component.props().secondAction.load('loaded', {
                lastSucceedAt: date,
                force: false
            });

            const state = store.getState();

            const data = secondAction.selectData(state);
            const meta = secondAction.selectMeta(state);

            expect(meta.lastSucceedAt).toEqual(date);
            expect(data).toEqual('loaded');
        });
    });

    describe('withAsyncActions({}, { dispatchOnMount, resetOnUnmount})', () => {
        const ComponentWithAsync = withAsyncActions({
            firstAction,
            secondAction,
        }, {dispatchOnMount: true, resetOnUnmount: true})(Component);

        const { wrapper, store } = setupComponent(ComponentWithAsync);
        const component = wrapper.find(Component);

        it('should render auto fetch data', () => {
            expect(component.find('#first').text()).toEqual(emptyDispatch);
            expect(component.find('#second').text()).toEqual('');
        });

        it('should auto reset state', () => {
            wrapper.unmount();
            const state = store.getState();

            expect(firstAction.selectData(state)).toEqual([]);
            expect(secondAction.selectData(state)).toEqual(null);
        });
    });

    describe('withAsyncActions({}, { resetOnUnmount })', () => {
        const ComponentWithAsync = withAsyncActions({
            firstAction,
        }, {resetOnMount: true})(Component);

        const store = configureStore({});
        store.dispatch(firstAction.success('noreset'));
        const { wrapper } = setupComponent(ComponentWithAsync, store);
        const component = wrapper.find(Component);

        it('should not render previous data', () => {
            expect(component.find('#first').length).toEqual(0);
        });
    });

    describe('withAsyncActions({ shouldUpdate }, { dispatchOnUpdate })', () => {
        const ComponentWithAsync = withAsyncActions({
            firstAction: firstAction.withShouldUpdate(({ waitForFirst }, { waitForFirst: nextWaitForFirst }) => !waitForFirst && nextWaitForFirst),
            secondAction: secondAction.withShouldUpdate(({ waitForSecond }, { waitForSecond: nextWaitForSecond }) => !waitForSecond && nextWaitForSecond),
        }, {dispatchOnMount: false, dispatchOnUpdate: true, resetOnUnmount: true})(Component);

        const { wrapper } = setup({ waitForFirst: false, waitForSecond: false }, ComponentWithAsync);
        const component = wrapper.find(Component);

        it('should render only not waiting', () => {
            expect(component.find('#first').length).toEqual(0);
            expect(component.find('#second').length).toEqual(0);
        });

        it('should render on update', () => {
            wrapper.setProps({
                waitForFirst: true
            });
            expect(component.find('#first').text()).toEqual(emptyDispatch);
            expect(component.find('#second').length).toEqual(0);

            wrapper.setProps({
                waitForSecond: true
            });
            expect(component.find('#first').text()).toEqual(emptyDispatch);
            expect(component.find('#second').text()).toEqual('');
        });
    });

    describe('withAsyncActions(() => {}, { dispatchOnUpdate })', () => {
        const ComponentWithAsync = withAsyncActions(({ first }) => ({
            firstAction: firstAction.withParams({ first }),
            secondAction: secondAction.withPayload(({ second }) => second),
        }), {dispatchOnMount: true, resetOnUnmount: true, dispatchOnUpdate: true})(Component);

        const { wrapper, store } = setupComponent(ComponentWithAsync);
        const component = wrapper.find(Component);

        it('should render auto fetch data', () => {
            const state = store.getState();

            expect(component.find('#first').text()).toEqual(emptyDispatch);
            expect(state.asyncClient.data[firstAction.type]['first_1']).toEqual(emptyDispatch);

            expect(component.find('#second').text()).toEqual(secondData);
        });

        it('should render auto update data on change props', () => {
            wrapper.setProps({second: '4'});
            const state = store.getState();

            expect(component.find('#first').text()).toEqual(emptyDispatch);
            expect(state.asyncClient.data[firstAction.type]['first_1']).toEqual(emptyDispatch);

            expect(component.find('#second').text()).toEqual('4');
        });

        it('should auto reset state', () => {
            wrapper.unmount();

            expect(component.find('#first').length).toEqual(0);
            expect(component.find('#second').length).toEqual(0);

            const state = store.getState();

            expect(firstAction.withParams({ first: 1 }).selectData(state)).toEqual([]);
            expect(secondAction.selectData(state)).toEqual(null);
        });
    });

    describe('withAsyncActions( ... action.withParams().withPayload() ...)', () => {
        const ComponentWithAsync = withAsyncActions(({ first }) => ({
            firstAction: firstAction.withParams({ first }).withPayload(({ first }) => first),
        }), {dispatchOnMount: true, resetOnUnmount: true, dispatchOnUpdate: true, resetOnUpdate: true})(Component);

        const { wrapper, store } = setupComponent(ComponentWithAsync);
        const component = wrapper.find(Component);

        it('should render auto fetch data', () => {
            expect(component.find('#first').text()).toEqual(firstData);

            const state = store.getState();

            expect(firstAction.withParams({ first: 1 }).selectData(state)).toEqual(firstData);
        });

        it('should render auto update data on change props', () => {
            wrapper.setProps({first: '4'});
            const state = store.getState();

            expect(component.find('#first').text()).toEqual('4');
            expect(firstAction.withParams({ first: 1 }).selectData(state)).toEqual([]);
            expect(firstAction.withParams({ first: 4 }).selectData(state)).toEqual('4');
        });

        it('should auto reset state', () => {
            wrapper.unmount();
            const state = store.getState();

            expect(component.find('#first').length).toEqual(0);
            expect(firstAction.withParams({ first: 1 }).selectData(state)).toEqual([]);
        });
    });

    describe('withAsyncAction({ metaHandler })', () => {
        const ComponentWithMetaHandler = withAsyncActions({
            firstAction: firstAction.withSuccessHandler(({ action }) => action()),
            secondAction: secondAction.withErrorHandler(({ action }) => action()),
            thirdAction: thirdAction.withPendingHandler(({ action }) => action())
        })(Component);

        const { wrapper } = setupComponent(ComponentWithMetaHandler);
        const component = wrapper.find(Component);

        it('should handle withSuccessHandler()', async () => {
            const defer = createPromise(firstData);
            component.props().firstAction.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(component.props().action).toHaveBeenCalledTimes(1);
        });

        it('should handle withErrorHandler()', async () => {
            const defer = createPromise(null, 'error');
            component.props().secondAction.dispatch(defer.promise);

            defer.reject();
            try {
                await defer.promise.catch();
            } catch(e) {
                expect(component.props().action).toHaveBeenCalledTimes(2);
            }
        });

        it('should handle withPendingHandler()', async () => {
            const defer = createPromise(firstData);
            component.props().thirdAction.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(component.props().action).toHaveBeenCalledTimes(3);
        });
    });

    describe('withAsyncActions( action.withSaga )', () => {
        let fn = jest.fn();
        let actionFn = jest.fn();
        let notFn = jest.fn();
        let saga = function* (getProps) {
            fn(getProps());
            yield take(FIRST_ACTION);
            const state = yield select(firstAction.selectData);
            actionFn(state);
            yield take('AFTER_UNMOUNT');
            notFn();
        };

        const ComponentWithSaga = withAsyncActions({
            firstAction: firstAction.withSaga(saga),
        })(Component);

        const { wrapper, store } = setupComponent(ComponentWithSaga);
        const component = wrapper.find(Component);

        it('should register saga with props on component mount', () => {
            expect(fn).toHaveBeenCalledWith(component.props());
        });

        it('should listen store actions and select store', () => {
            component.props().firstAction.dispatch('asd');
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
