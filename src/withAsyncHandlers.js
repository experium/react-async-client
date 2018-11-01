import React, { Component } from 'react';
import { forEachObjIndexed, equals, keys, pathOr, pick, prop, when } from 'ramda';
import { toSuccess, toError, toRequest } from './actionHelpers';
import { getActions, callWithProps } from './asyncHelpers';
import { takeEvery } from 'redux-saga/effects';
import { withSagas } from './withSagas';

const handlerTakers = {
    successHandler: toSuccess,
    errorHandler: toError,
    pendingHandler: toRequest,
};
const handlerProps = keys(handlerTakers);

const getHandlerPattern = (asyncAction, actionType, getProps) => {
    return (takedAction) => {
        if (takedAction.type === actionType) {
            const props = getProps();

            return equals(callWithProps(asyncAction.params, props), takedAction.requestAction.params);
        }

        return false;
    }
};

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
                    const actionType = handlerTakers[key] && handlerTakers[key](
                        pathOr(action.type, [actionName, 'type'], props)
                    );

                    if (handler && actionType) {
                        sagas.push(function* (getProps) {
                            const pattern = getHandlerPattern(action, actionType, getProps);

                            yield takeEvery(pattern, function* (takedAction) {
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
