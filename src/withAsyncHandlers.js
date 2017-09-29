import React, { Component } from 'react';
import { forEachObjIndexed} from 'ramda';

export const withAsyncHandlers = asyncActionsHandlers => {
    return WrappedComponent => class extends Component {
        componentWillReceiveProps(nextProps) {
            forEachObjIndexed((handlers, key) => {
                if (this.props[key] && this.props[key].meta) {
                    const { success : successHandler, error : errorHandler, pending : pendingHandler } = handlers;
                    const { success, error, pending } = this.props[key].meta;
                    const { meta } = nextProps[key];

                    if (successHandler && !success && meta.success) successHandler(this.props, nextProps);
                    if (errorHandler && !error && meta.error) errorHandler(this.props, nextProps);
                    if (pendingHandler && !pending && meta.pending) pendingHandler(this.props, nextProps);
                }
            }, asyncActionsHandlers);
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    };
};
