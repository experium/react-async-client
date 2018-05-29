import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { forEach, map } from 'ramda';
import { runSaga } from './utils/saga';

export const withSagas = sagas => WrappedComponent => {
    return class extends Component {
        static contextTypes = {
            sagaMiddleware: PropTypes.func.isRequired
        };

        sagaTasks = [];

        getProps = () => {
            return this.props;
        }

        componentDidMount() {
            this.sagaTasks = map(saga => runSaga(this.context.sagaMiddleware, saga, this.getProps), sagas);
        }

        componentWillUnmount() {
            forEach(task => task.cancel(), this.sagaTasks);
        }

        render() {
            return <WrappedComponent {...this.props} />
        }
    }
}
