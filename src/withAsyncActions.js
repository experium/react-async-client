import React, { Component } from 'react';
import { compose, map, mapObjIndexed, assoc, forEachObjIndexed, fromPairs } from 'ramda';
import { connect } from 'react-redux';
import { getActionData, getActionMeta, getActions } from './asyncHelpers';
import { equals, merge, when, prop, forEach } from 'ramda';
import { renameKeys } from './utils/ramdaAdditions';
import { withAsyncHandlers } from './withAsyncHandlers';

const defaultOptions = {
    connectData: true,
    connectMeta: true,
    resetOnMount: false,
    resetOnUpdate: false,
    resetOnUnmount: false,
    dispatchOnMount: false,
    dispatchOnUpdate: false,
    skipExtraRender: true,
};

const defaultShouldUpdate = (props, nextProps, action) => {
    if (!action.defaultPayload) {
        return false;
    }

    return !equals(action.defaultPayload(props), action.defaultPayload(nextProps));
}

const renameDeprecatedKeys = renameKeys({
    autoFetch: 'dispatchOnMount',
    autoUpdate: 'dispatchOnUpdate',
    autoReset: 'resetOnUnmount',
});

export const withAsyncActions = (actionsConfig, options = {}) => {
    options = merge(defaultOptions, renameDeprecatedKeys(options));
    const getOptions = action => merge(options, renameDeprecatedKeys(action.options));

    return WrappedComponent => {
        let intervals = [];

        const hoc = class extends Component {
            constructor(props) {
                super(props);
                this.state = {
                    skipRender: false,
                };
            }

            componentWillMount() {
                const actions = getActions(this.props, actionsConfig);
                forEachObjIndexed((action, key) => {
                    when(prop('dispatchOnMount'), (options) => {
                        when(prop('skipExtraRender'), () => this.setState({ skipRender: true }))(options);
                        const getPayload = action.defaultPayload;
                        this.props[key].dispatch(getPayload && getPayload(this.props));
                        when(prop('pollInterval'), () => {
                            intervals.push(setInterval(() => {
                                this.props[key].dispatch(getPayload && getPayload(this.props));
                            }, options.pollInterval));
                        })(options);
                    })(getOptions(action));
                    when(prop('resetOnMount'), (options) => {
                        when(prop('skipExtraRender'), () => this.setState({ skipRender: true }))(options);
                        this.props[key].reset();
                    })(getOptions(action));
                }, actions);
            }

            componentWillReceiveProps(nextProps) {
                this.setState({
                    skipRender: false,
                })
                forEachObjIndexed((action, key) => when(prop('dispatchOnUpdate'), (options) => {
                    const shouldUpdate = action.shouldUpdate || defaultShouldUpdate;
                    if (shouldUpdate(this.props, nextProps, action)) {
                        when(prop('resetOnUpdate'), this.props[key].reset)(options);

                        const getPayload = action.defaultPayload;
                        nextProps[key].dispatch(getPayload && getPayload(nextProps));
                    }
                })(getOptions(action)), getActions(this.props, actionsConfig));
            }

            componentWillUnmount() {
                forEachObjIndexed(
                    (action, key) => when(prop('resetOnUnmount'), this.props[key].reset)(getOptions(action)),
                    getActions(this.props, actionsConfig)
                );
                forEach(clearInterval, intervals);
            }

            render() {
                return this.state.skipRender ? null : <WrappedComponent {...this.props} />;
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
