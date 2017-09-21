import { path, contains } from 'ramda';
import { noParamsKey } from './asyncHelpers';

export default function noParamsReducer(customReducer, actions) {
    return (state, action, defaultReducer) => {
        const items = path([noParamsKey], state);

        return items && contains(action.type, actions)
            ? { ...state, [noParamsKey]: customReducer(items, action) }
            : defaultReducer(state, action);
    }
}
