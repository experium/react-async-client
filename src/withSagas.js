import React, { Component } from 'react';
import { forEach, map } from 'ramda';
import { runSaga } from './utils/saga';

export const withSagas = sagas => WrappedComponent => {
    return class extends Component {
        sagaTasks = [];

        getProps = () => {
            return this.props;
        }

        componentWillMount() {
            this.sagaTasks = map(saga => runSaga(saga, this.getProps), sagas);
        }

        componentWillUnmount() {
            forEach(task => task.cancel(), this.sagaTasks);
        }

        render() {
            return <WrappedComponent {...this.props} />
        }
    }
}
