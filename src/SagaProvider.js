import { Component } from 'react';
import PropTypes from 'prop-types';

export class SagaProvider extends Component {
    static propTypes = {
        sagaMiddleware: PropTypes.func.isRequired
    };

    static childContextTypes = {
        sagaMiddleware: PropTypes.func.isRequired
    };

    getChildContext() {
        const { sagaMiddleware } = this.props;

        return { sagaMiddleware };
    }

    render() {
        return this.props.children;
    }
}
