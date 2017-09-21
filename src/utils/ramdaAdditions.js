import { is, omit, until, ifElse, isNil, of, join, compose, juxt, toUpper, head, tail } from 'ramda';

export const isPlainObject = v => is(Object, v) && v.constructor === Object;

export const exceptComponentsProps = (constructor, props, options = {}) => {
    return omit(Object.keys(options.except || constructor.propTypes), props);
};

export const toArray = until(is(Array), ifElse(isNil, () => [], of));

export const capitalize = compose(
    join(''),
    juxt([compose(toUpper, head), tail])
);
