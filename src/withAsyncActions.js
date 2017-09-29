import React, { Component } from 'react';
import { compose, map, mapObjIndexed, is, assoc, forEachObjIndexed, fromPairs } from 'ramda';
import { connect } from 'react-redux';
import { getActionData, getActionMeta } from './asyncHelpers';
import { runSaga } from './utils/saga';
import { equals, merge, when, prop, forEach, invoker } from 'ramda';

const defaultOptions = {
    connectData: true,
    connectMeta: true,
};

const defaultShouldUpdate = (props, nextProps, action) => {
    if (!action.defaultPayload) {
        return false;
    }

    return !equals(action.defaultPayload(props), action.defaultPayload(nextProps));
}

export const withAsyncActions = (actions, options = {}) => {
    options = merge(defaultOptions, options);

    return WrappedComponent => {
        const getActions = props => is(Function, actions) ? actions(props) : actions;
        let intervals = [];
        let sagaTasks = [];

        const hoc = class extends Component {
            componentWillMount() {
                const actions = getActions(this.props);
                forEachObjIndexed((action, key) => when(prop('autoFetch'), (options) => {
                    const getPayload = action.defaultPayload;
                    this.props[key].dispatch(getPayload && getPayload(this.props));
                    when(prop('pollInterval'), () => {
                        intervals.push(setInterval(() => {
                            this.props[key].dispatch(getPayload && getPayload(this.props));
                        }, options.pollInterval));
                    })(options);
                })(merge(options, action.options)), actions);

                forEachObjIndexed(when(prop('saga'), (action) => {
                    sagaTasks.push(runSaga(action.saga, this.props));
                }), actions);
            }

            componentWillReceiveProps(nextProps) {
                forEachObjIndexed((action, key) => when(prop('autoUpdate'), () => {
                    const shouldUpdate = action.shouldUpdate || defaultShouldUpdate;
                    if (shouldUpdate(this.props, nextProps, action)) {
                        this.props[key].reset();

                        const getPayload = action.defaultPayload;
                        nextProps[key].dispatch(getPayload && getPayload(nextProps));
                    }
                })(merge(options, action.options)), getActions(this.props));

                forEachObjIndexed((action, key) => {
                    if (this.props[key].meta) {
                        const { successHandler, errorHandler, pendingHandler } = action;
                        const { success, error, pending } = this.props[key].meta;
                        const { meta } = nextProps[key];

                        if (successHandler && !success && meta.success) successHandler(this.props, nextProps);
                        if (errorHandler && !error && meta.error) errorHandler(this.props, nextProps);
                        if (pendingHandler && !pending && meta.pending) pendingHandler(this.props, nextProps);
                    }
                }, getActions(this.props));
            }

            componentWillUnmount() {
                forEachObjIndexed((action, key) => when(prop('autoReset'), this.props[key].reset)(merge(options, action.options)), getActions(this.props));
                forEach(clearInterval, intervals);
                forEach(task => task.cancel(), sagaTasks);
            }

            render() {
                return <WrappedComponent {...this.props} />
            }
        }

        const stateToProps = (state, props) => {
            let items = [];
            forEachObjIndexed((action, actionName) => {
                const actionOptions = merge(options, action.options || {});
                if (actionOptions.connectData) {
                    items.push([actionName + '_data', getActionData(action, state)]);
                }
                if (actionOptions.connectMeta) {
                    items.push([actionName + '_meta', getActionMeta(action, state)]);
                }
            }, getActions(props));
            return fromPairs(items);
        };

        const dispatchToProps = (dispatch, props) => {
            return map((action) => {
                const dispatchAction = compose(dispatch, assoc('params', action.params), action);
                const defaultPayload = action.defaultPayload && action.defaultPayload(props);
                return {
                    refresh: (payload) => dispatchAction(payload || defaultPayload),
                    dispatch: dispatchAction,
                    request: compose(dispatch, assoc('params', action.params), action.request),
                    success: compose(dispatch, assoc('params', action.params), action.success),
                    error: compose(dispatch, assoc('params', action.params), action.error),
                    reset: compose(dispatch, assoc('params', action.params), action.reset)
                }
            }, getActions(props));
        };

        const mergeProps = (stateProps, dispatchProps, ownProps) => {
            return {
                ...ownProps,
                ...mapObjIndexed((action, key) => {
                    return {
                        data: stateProps[key + '_data'],
                        meta: stateProps[key + '_meta'],
                        ...dispatchProps[key]
                    }
                }, getActions(ownProps))
            }
        };

        return connect(stateToProps, dispatchToProps, mergeProps)(hoc);
    }
}
