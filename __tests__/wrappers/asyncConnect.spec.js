import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import { createPromise } from '../test-utils/promiseHandlers';
import configureStore from '../test-utils/configureStore';
import {
    createAsyncAction,
    asyncConnect,
    SagaProvider
} from '../../src/index';

const Component = () => null;

const setup = (AsyncComponent, storeConfig = configureStore({ user: {} })) => {
    const { store, sagaMiddleware } = storeConfig;

    return {
        wrapper: mount(
            <SagaProvider sagaMiddleware={sagaMiddleware}>
                <Provider store={store}>
                    <AsyncComponent />
                </Provider>
            </SagaProvider>
        ),
        store
    };
};

describe('asyncClient HOC', () => {
    const action = createAsyncAction('ACTION_TYPE', ({ payload }) => payload, 'stateData');
    const firstAction = createAsyncAction('FIRST_ACTION', ({ payload }) => payload || emptyDispatch, []);
    const secondAction = createAsyncAction('SECOND_ACTION', ({ payload }) => payload, null);

    const ComponentWithAsync = asyncConnect({
        action,
    }, (state) => ({
        connectData: action.selectData(state)
    }), {
        origAction: action
    })(Component);

    const component = setup(ComponentWithAsync).wrapper.find(Component);

    it('should have connected async action', () => {
        expect(component.props().action.data).toEqual('stateData');
    });

    it('should have connected state', () => {
        expect(component.props().connectData).toEqual('stateData');
    });

    it('should have connected actions', () => {
        expect(component.props().origAction).not.toEqual(action);
        expect(component.props().origAction()).toEqual(action());
    });

    describe('asyncConnect() renders', () => {
        const createAndSetupComponent = (actions) => {
            let rendersCount = 0;
            const stateToProps = (state) => ({
                user: state.user
            });

            const { store } = setup(asyncConnect(actions, stateToProps)(() => {
                ++rendersCount;

                return null;
            }));

            const getRendersCount = () => rendersCount;

            return {
                store,
                getRendersCount
            };
        }

        it('should not call extra render', async () => {
            const { store, getRendersCount } = createAndSetupComponent({
                firstAction: firstAction.withOptions({
                    resetOnMount: true
                }),
            });

            const defer = createPromise();

            store.dispatch(secondAction(defer.promise));
            store.dispatch(secondAction(defer.promise));
            store.dispatch(secondAction(defer.promise));

            defer.resolve();
            await defer.promise.then();

            expect(getRendersCount()).toEqual(1);
        });
    });
});
