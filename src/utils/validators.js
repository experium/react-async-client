import not from 'ramda/src/not';
import always from 'ramda/src/always';
import complement from 'ramda/src/complement';
import either from 'ramda/src/either';
import gt from 'ramda/src/gt';
import lt from 'ramda/src/lt';
import length from 'ramda/src/length';
import compose from 'ramda/src/compose';
import test from 'ramda/src/test';

import {EMAIL} from '../constants/patterns';

export const required = [ not, always('Это поле обязательно для заполнения') ];
export const email = [ complement(test(EMAIL)), always('Вы ввели невалидный e-mail адрес') ];

const passOutOfRange = either(gt(6), lt(15));
export const password = [ compose(passOutOfRange, length), always('Пароль должен содержать от 6 до 15 символов') ];
