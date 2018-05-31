import { takeLatest } from 'redux-saga/effects';
import { requestGenerator } from './utils/redux';

const createSaga = (generator = requestGenerator, taker = takeLatest) => {
    return action => taker(action.type, generator, action);
};

export default createSaga;
