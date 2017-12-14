import { withAsyncActions } from './withAsyncActions';

export const asyncConnect = (
    actionsConfig,
    mapStateToProps,
    mapDispatchToProps
) => withAsyncActions(
    actionsConfig,
    undefined,
    mapStateToProps,
    mapDispatchToProps,
);
