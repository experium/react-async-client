import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import configureStore from '../test-utils/configureStore';
import {
    createAsyncAction,
    asyncConnect
} from '../../src/index';

const Component = () => null;

const setup = (AsyncComponent, store = configureStore({})) => {
    return mount(
        <Provider store={store}>
            <AsyncComponent />
        </Provider>
    );
};

describe('asyncClient HOC', () => {
    const action = createAsyncAction('ACTION_TYPE', ({ payload }) => payload, 'stateData');

    const ComponentWithAsync = asyncConnect({
        action,
    }, (state) => ({
        connectData: action.selectData(state)
    }), {
        origAction: action
    })(Component);

    const component = setup(ComponentWithAsync).find(Component);

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
});
