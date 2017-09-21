import { takeLatest } from 'redux-saga/effects';
import { requestGenerator } from './utils/redux';

export default function createSaga(action, taker = takeLatest) {
    return taker(action.type, requestGenerator, action);
}
