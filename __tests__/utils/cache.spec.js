import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import { createPromise } from '../test-utils/promiseHandlers';
import configureStore, { sagaMiddleware } from '../test-utils/configureStore';
import {
    createAsyncAction,
    withAsyncActions,
    SagaProvider,
    createRequestCacheGenerator,
    noParamsKey,
} from '../../src/index';

const cache = {};
const error = { message: 'error' };

const setItem = (path, data) => {
    cache[path] = data;
};

const getItem = (path) => {
    const data = cache[path];
    const defer = createPromise(data, error);

    if (data) {
        defer.resolve();
    } else {
        defer.reject();
    }

    return defer.promise;
};

const cacheSagaGenerator = createRequestCacheGenerator({
    setItem,
    getItem
});

const actionType = 'CACHE_ACTION';

const Component = ({ configuratedAction: { data, meta } }) => (
    <div id='data'>
        { meta.lastSucceedAt ? data : (
            meta.error && meta.error.message
        )}
    </div>
);

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

describe('cache utils', () => {

    const configuratedAction = createAsyncAction({
        actionName: actionType,
        handler: ({ payload }) => payload,
        customSagaGenerator: cacheSagaGenerator
    });

    describe('should use createCacheSagaGenerator', () => {
        const ComponentWithHandlers = withAsyncActions({ configuratedAction })(
            Component
        );

        const { wrapper } = setup(ComponentWithHandlers);
        const component = wrapper.find(Component);


        it('should render from cache', async () => {
            setItem(`${actionType}/${noParamsKey}`, {
                response: 'cached',
                lastSucceedAt: (new Date()).toISOString(),
            });
            component.props().configuratedAction.reset();

            const defer = createPromise('data', error);
            component.props().configuratedAction.dispatch(defer.promise);

            defer.reject();
            try {
                await defer.promise.then();
            } catch(e) {
                expect(component.find('#data').text()).toEqual('cached');
            }
        });

        it('should skip render from cache', async () => {
            component.props().configuratedAction.reset();

            const defer = createPromise('data', error);
            component.props().configuratedAction.dispatch(defer.promise, { skipCache: true });

            defer.reject();
            try {
                await defer.promise.then();
            } catch(e) {
                expect(component.find('#data').text()).toEqual('error');
            }
        });

        it('should render error', async () => {
            component.props().configuratedAction.reset();
            setItem(`${actionType}/${noParamsKey}`, null);
            const defer = createPromise('data', error);
            component.props().configuratedAction.dispatch(defer.promise);

            defer.reject();
            try {
                await defer.promise.then();
            } catch(e) {
                expect(component.find('#data').text()).toEqual('error');
            }
        });

        it('should render without cache', async () => {
            component.props().configuratedAction.reset();
            const defer = createPromise('data', error);
            component.props().configuratedAction.dispatch(defer.promise);

            defer.resolve();
            await defer.promise.then();

            expect(component.find('#data').text()).toEqual('data');
        });
    });
});
