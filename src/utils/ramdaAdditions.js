import {
    is,
    omit,
    until,
    ifElse,
    isNil,
    of,
    join,
    compose,
    juxt,
    toUpper,
    head,
    tail,
    curry,
    reduce,
    assoc,
    keys,
} from 'ramda';

export const isPlainObject = v => is(Object, v) && v.constructor === Object;

export const exceptComponentsProps = (constructor, props, options = {}) => {
    return omit(Object.keys(options.except || constructor.propTypes), props);
};

export const renameKeys = curry((keysMap, obj) =>
    reduce((acc, key) => assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj))
);

export const toArray = until(is(Array), ifElse(isNil, () => [], of));

export const capitalize = compose(
    join(''),
    juxt([compose(toUpper, head), tail])
);
