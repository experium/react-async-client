import React, { Component } from 'react';
import { forEachObjIndexed, pathOr, pick, prop, when } from 'ramda';
import { toSuccess, toError, toRequest } from './actionHelpers';
import { takeEvery } from 'redux-saga/effects';
import { withSagas } from './withSagas';

const handlerTakers = {
    successHandler: toSuccess,
    errorHandler: toError,
    pendingHandler: toRequest,
};

export const withAsyncHandlers = actions => {
    return WrappedComponent => class extends Component {
        constructor(props) {
            super(props);
            let sagas = [];

            forEachObjIndexed((action, actionName) => {
                when(prop('saga'), action => {
                    sagas.push(action.saga);
                }, action);

                const actionHandlers = pick(['successHandler', 'errorHandler', 'pendingHandler'], action);
                forEachObjIndexed((handler, key) => {
                    const actionType = pathOr(action.type, [actionName, 'type'], props);
                    const toHandlerType = handlerTakers[key];

                    if (handler && actionType && toHandlerType) {
                        sagas.push(function* (getProps) {
                            yield takeEvery(toHandlerType(actionType), function*() {
                                yield handler(getProps());
                            });
                        });
                    }
                }, actionHandlers);
            }, actions);

            this.Component = withSagas(sagas)(WrappedComponent);
        }

        render() {
            return <this.Component {...this.props} />;
        }
    };
};
