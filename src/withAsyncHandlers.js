import React, { Component } from 'react';
import { forEachObjIndexed, keys, pathOr, pick, prop, when } from 'ramda';
import { toSuccess, toError, toRequest } from './actionHelpers';
import { getActions } from './asyncHelpers';
import { takeEvery } from 'redux-saga/effects';
import { withSagas } from './withSagas';

const handlerTakers = {
    successHandler: toSuccess,
    errorHandler: toError,
    pendingHandler: toRequest,
};
const handlerProps = keys(handlerTakers);

export const withAsyncHandlers = actionsConfig => {
    return WrappedComponent => class extends Component {
        constructor(props) {
            super(props);
            const actions = getActions(props, actionsConfig);
            let sagas = [];

            forEachObjIndexed((action, actionName) => {
                when(prop('saga'), action => {
                    sagas.push(action.saga);
                }, action);

                const actionHandlers = pick(handlerProps, action);
                forEachObjIndexed((handler, key) => {
                    const actionType = pathOr(action.type, [actionName, 'type'], props);
                    const toHandlerType = handlerTakers[key];

                    if (handler && actionType && toHandlerType) {
                        sagas.push(function* (getProps) {
                            yield takeEvery(toHandlerType(actionType), function*(takedAction) {
                                yield handler(getProps(), takedAction);
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
