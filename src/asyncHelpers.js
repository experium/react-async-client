import { compose, join, flatten, toPairs, path, append, when, is } from 'ramda';

export const noParamsKey = '__NO_PARAMS__';
export const defaultKey = '__DEFAULT__';

export const getPath = when(is(Object), compose(join('_'), flatten, toPairs));
export const callWithProps = (objectOrFunction, props) => is(Function, objectOrFunction) ? objectOrFunction(props) : objectOrFunction;
export const getActions = (props, actions) => callWithProps(actions, props);

export const getData = type => (action, state, props) => {
    const dataPath = ['asyncClient', type, action.type];

    const params = callWithProps(action.params, props);
    const paramsPath = append(getPath(params || noParamsKey), dataPath);
    const defaultPath = append(defaultKey, dataPath);

    const data = path(paramsPath, state);

    return (data === undefined) ? path(defaultPath, state) : data;
}

export const getActionData = getData('data');
export const getActionMeta = getData('meta');
