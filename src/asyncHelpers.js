import { compose, join, flatten, toPairs, path, append, when, is } from 'ramda';

export const noParamsKey = '__NO_PARAMS__';
export const defaultKey = '__DEFAULT__';

export const getPath = when(is(Object), compose(join('_'), flatten, toPairs));

export const getData = type => (action, state) => {
    const dataPath = ['asyncClient', type, action.type];

    const paramsPath = append(getPath(action.params || noParamsKey), dataPath);
    const defaultPath = append(defaultKey, dataPath);

    const data = path(paramsPath, state);

    return (data === undefined) ? path(defaultPath, state) : data;
}

export const getActionData = getData('data');
export const getActionMeta = getData('meta');
