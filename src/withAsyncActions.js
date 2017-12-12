import React, { Component } from 'react';
import { compose, map, mapObjIndexed, assoc, forEachObjIndexed, fromPairs } from 'ramda';
import { connect } from 'react-redux';
import { getActionData, getActionMeta, getActions } from './asyncHelpers';
import { equals, merge, when, prop, forEach } from 'ramda';
import { withAsyncHandlers } from './withAsyncHandlers';

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

export const withAsyncActions = (actionsConfig, options = {}) => {
    options = merge(defaultOptions, options);

    return WrappedComponent => {
        let intervals = [];

        const hoc = class extends Component {
            componentWillMount() {
                const actions = getActions(this.props, actionsConfig);
                forEachObjIndexed((action, key) => {
                    const actionOptions = merge(options, action.options);
                    when(prop('resetOnMount'), this.props[key].reset)(actionOptions);
                    when(prop('dispatchOnMount'), (options) => {
                        const getPayload = action.defaultPayload;
                        this.props[key].dispatch(getPayload && getPayload(this.props));
                        when(prop('pollInterval'), () => {
                            intervals.push(setInterval(() => {
                                this.props[key].dispatch(getPayload && getPayload(this.props));
                            }, options.pollInterval));
                        })(options);
                    })(actionOptions);
                }, actions);
            }

            componentWillReceiveProps(nextProps) {
                forEachObjIndexed((action, key) => when(prop('dispatchOnUpdate'), (options) => {
                    const shouldUpdate = action.shouldUpdate || defaultShouldUpdate;
                    if (shouldUpdate(this.props, nextProps, action)) {
                        if (options.resetOnUpdate) {
                            this.props[key].reset();
                        }

                        const getPayload = action.defaultPayload;
                        nextProps[key].dispatch(getPayload && getPayload(nextProps));
                    }
                })(merge(options, action.options)), getActions(this.props, actionsConfig));
            }

            componentWillUnmount() {
                forEachObjIndexed(
                    (action, key) => when(prop('resetOnUnmount'), this.props[key].reset)(
                        merge(options, action.options)
                    ),
                    getActions(this.props, actionsConfig)
                );
                forEach(clearInterval, intervals);
            }

            render() {
                return <WrappedComponent {...this.props} />;
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
            }, getActions(props, actionsConfig));
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
            }, getActions(props, actionsConfig));
        };

        const mergeProps = (stateProps, dispatchProps, ownProps) => {
            return {
                ...ownProps,
                ...mapObjIndexed((action, key) => {
                    return {
                        type: action.type,
                        data: stateProps[key + '_data'],
                        meta: stateProps[key + '_meta'],
                        ...dispatchProps[key]
                    }
                }, getActions(ownProps, actionsConfig))
            }
        };

        return connect(stateToProps, dispatchToProps, mergeProps)(
            withAsyncHandlers(actionsConfig)(hoc)
        );
    }
}
