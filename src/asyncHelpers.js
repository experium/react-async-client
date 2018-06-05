import { compose, join, flatten, toPairs, path, append, when, is } from 'ramda';

export const noParamsKey = '__NO_PARAMS__';
export const defaultKey = '__DEFAULT__';

export const getPath = when(is(Object), compose(join('_'), flatten, toPairs));
export const callWithProps = (objectOrFunction, props) => is(Function, objectOrFunction) ? objectOrFunction(props) : objectOrFunction;
export const getActions = (props, actions) => callWithProps(actions, props);

export const getData = (type, action, state, params) => {
    const dataPath = ['asyncClient', type, action.type];

    const paramsPath = append(getPath(params), dataPath);
    const defaultPath = append(defaultKey, dataPath);

    const data = path(paramsPath, state);

    return (data === undefined) ? path(defaultPath, state) : data;
}

export const getDataFromProps = type => (action, state, props) => {
    const params = callWithProps(action.params, props);
    return getData(type, action, state, params || noParamsKey);
}

export const getActionData = getDataFromProps('data');
export const getActionMeta = getDataFromProps('meta');

export const selectData = type => action => state => {
    const params = action.params || noParamsKey;
    return getData(type, action, state, params);
};

export const selectActionData = selectData('data');
export const selectActionMeta = selectData('meta');
