import React, { Component } from 'react';
import { compose, map, mapObjIndexed, assoc, forEachObjIndexed, fromPairs, is } from 'ramda';
import { connect } from 'react-redux';
import { getActionData, getActionMeta, getActions, callWithProps } from './asyncHelpers';
import { equals, merge, when, prop, forEach, omit } from 'ramda';
import { renameKeys } from './utils/ramdaAdditions';
import { withAsyncHandlers } from './withAsyncHandlers';
import { bindActionCreators } from 'redux';

const defaultOptions = {
    connectData: true,
    connectMeta: true,
    resetOnMount: false,
    resetOnUpdate: false,
    resetOnUnmount: false,
    dispatchOnMount: false,
    dispatchOnUpdate: false,
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

export const withAsyncActions = (actionsConfig, options = {}, mapStateToProps, mapDispatchToProps) => {
    options = merge(defaultOptions, renameDeprecatedKeys(options));
    const getOptions = (action, props) => merge(options, renameDeprecatedKeys(callWithProps(action.options, props)));

    return WrappedComponent => {
        let intervals = [];

        const hoc = class extends Component {
            componentDidMount() {
                const actions = getActions(this.props, actionsConfig);
                forEachObjIndexed((action, key) => {
                    when(prop('dispatchOnMount'), (options) => {
                        const getPayload = action.defaultPayload;
                        this.props[key].dispatch(getPayload && getPayload(this.props));
                        when(prop('pollInterval'), () => {
                            intervals.push(setInterval(() => {
                                this.props[key].dispatch(getPayload && getPayload(this.props));
                            }, options.pollInterval));
                        })(options);
                    })(getOptions(action, this.props));
                    when(prop('resetOnMount'), () => {
                        this.props[key].reset();
                    })(getOptions(action, this.props));
                }, actions);
            }

            componentDidUpdate(prevProps) {
                forEachObjIndexed((action, key) => when(prop('dispatchOnUpdate'), (options) => {
                    const shouldUpdate = action.shouldUpdate || defaultShouldUpdate;
                    if (shouldUpdate(prevProps, this.props, action)) {
                        when(prop('resetOnUpdate'), prevProps[key].reset)(options);

                        const getPayload = action.defaultPayload;
                        this.props[key].dispatch(getPayload && getPayload(this.props));
                    }
                })(getOptions(action, this.props)), getActions(this.props, actionsConfig));
            }

            componentWillUnmount() {
                forEachObjIndexed(
                    (action, key) => when(prop('resetOnUnmount'), this.props[key].reset)(getOptions(action, this.props)),
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
                    items.push([actionName + '_data', getActionData(action, state, props)]);
                }
                if (actionOptions.connectMeta) {
                    items.push([actionName + '_meta', getActionMeta(action, state, props)]);
                }
            }, getActions(props, actionsConfig));

            if (mapStateToProps) {
                return {
                    ...fromPairs(items),
                    ...mapStateToProps(state, props),
                };
            } else {
                return fromPairs(items);
            }
        };

        const dispatchToProps = (dispatch, props) => {
            const actions =  map((action) => {
                const params = callWithProps(action.params, props);
                const assocParams = assoc('params', params);
                const composeAction = action => compose(dispatch, assocParams, action);
                const dispatchAction = composeAction(action);
                const defaultPayload = action.defaultPayload && action.defaultPayload(props);
                return {
                    refresh: (payload) => dispatchAction(payload || defaultPayload),
                    dispatch: dispatchAction,
                    request: composeAction(action.request),
                    success: composeAction(action.success),
                    error: composeAction(action.error),
                    reset: composeAction(action.reset),
                    load: composeAction(action.load)
                }
            }, getActions(props, actionsConfig));

            const connectDispatch = is(Object, mapDispatchToProps)
                ? bindActionCreators(mapDispatchToProps, dispatch)
                : mapDispatchToProps && mapDispatchToProps(dispatch, props);

            return merge(actions, { __connect: connectDispatch });
        };

        const mergeProps = (stateProps, dispatchProps, ownProps) => {
            let stateToProps = stateProps;
            return {
                ...ownProps,
                ...mapObjIndexed((action, key) => {
                    stateToProps = omit([key + '_data', key + '_meta'], stateToProps);

                    return {
                        type: action.type,
                        data: stateProps[key + '_data'],
                        meta: stateProps[key + '_meta'],
                        ...dispatchProps[key]
                    }
                }, getActions(ownProps, actionsConfig)),
                ...stateToProps,
                ...dispatchProps.__connect,
            }
        };

        return connect(stateToProps, dispatchToProps, mergeProps)(
            withAsyncHandlers(actionsConfig)(hoc)
        );
    }
}
