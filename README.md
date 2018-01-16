# React async client
[![Build Status](https://travis-ci.org/experium/react-async-client.svg?branch=master)](https://travis-ci.org/experium/react-async-client)

#### `createAsyncAction(actionName, handler, initialState = undefined, sagaTaker = takeLatest, customReducer = defaultReducer)`
The function creates an action, a saga, a data reducer and a meta reducer.

* `actionName (String)` - action name
* `handler (Function)` - action handler
* `initialState (any)` - reducer initial state
* `sagaTaker (Function)` - saga effect function
* `customReducer (Function)` - custom reducer function

Usage example:
```javascript
import { createAsyncAction, takeFirst } from 'experium-modules';
import axios from 'axios';

const getUser = createAsyncAction('GET_USER', () => axios.get('/user'), {});
const getUserOnce = createAsyncAction('GET_USER_ONCE', () => axios.get('/user'), {}, takeFirst);
```
#### `getAsyncSagas()`
Return sagas created by `createAsyncAction()`.

Usage example:
```javascript
import { getAsyncSagas } from 'experium-modules';
import { all } from 'redux-saga/effects';

function* rootSaga() {
    yield all(getAsyncSagas());
}
```
#### `getAsyncReducers()`
Return data and meta reducers created by `createAsyncAction()`.

Usage example:
```javascript
import { getAsyncReducers } from 'experium-modules';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
    ...getAsyncReducers();
});
```
#### `withAsyncActions(actions || actionsGetter, options)` HOC
`withAsyncActions` HOC creates component with extended actions.
* `actions (Object) || actionsGetter (Function)` - actions which we want to extend and pass to component.
* `options (Object)` - you can provide options to Async HOC component.

Actions object could had these properties:

Actions getter function `actionsGetter(props) => object` used to bind props in action.

Options object could had these properties:
* `dispatchOnMount (bool)` - call `action.dispatch(payload)` on `componentWillMount`
* `dispatchOnUpdate (bool)` - call `action.dispatch(payload)` with nextProps if `withPayload(this.props)` doesnt equals `withPayload(nextProps)` on `componentWillReceiveProps`
* `resetOnUpdate (bool)` - will call `action.reset()` before dispatching when `dispatchOnUpdate` is `true`
* `resetOnUnmount (bool)` - call `action.reset()` on `componentWillUnmount`
* `resetOnMount (bool)` - call `action.reset(payload)` on `componentWillMount`
* `skipExtraRender (bool)` - skip first render when using with `dispatchOnMount` or `resetOnMount`
* `pollInterval (int)` - periodically dispatch action with `defaultPayload`

Return extended component that in props have action object with these properties:
* `dispatch (Function)` - call handler
* `reset (Function)` - reset reducer state
* `error (Function)` - set error in reducer state
* `success (Function)` - set data in reducer state
* `load (Function)` - force set data in state
* `data (any)` - action data
* `meta (Object)` - action meta. Meta has `pending`, `success` and `error` properties.

Basic usage example:
```javascript
import { withAsyncActions } from 'experium-modules';
import { getUser } from './actions';

class Page extends Component {
    componentDidMount() {
        this.props.getUser.dispatch();
    }
    render() {
        return <div>Page of { this.props.data }</div>;
    }
}

Page = withAsyncActions({ getUser })(Page);
```

`actionsGetter (Function) => actions (Object)` actionsGetter function provide props to first argument
and should return object of asyncClient actions.

Action can be extended with params or payload:
* `withParams(params (Object || String))` - tell asyncClient to store results of action by string of params path
* `withPayload(getPayload (Function))` - tell asyncClient to get payload for dispatch of autoFetch or autoUpdate by

Usage example:
```javascript
import { withAsyncActions } from 'experium-modules';
import { getUser } from './actions';

class Page extends Component {
    componentDidMount = () {
        this.props.getUserFirst.dispatch();
        this.props.getUserSecond.dispatch();
    }

    render() {
        const { getUserFirst, getUserSecond } = this.props;
        return (
            <div>
                { getUserFirst.meta.success && getUserFirst.data.name }
                { getUserSecond.meta.success && getUserSecond.data.name }
            </div>
        );
    }
}

const propsToAction = () => ({
    getUserFirst: getUser.withPayload((props) => props.firstId),
    getUserSecond: getUser.withPayload((props) => props.secondId)
});

const PageWithAsync = withAsyncActions(propsToAction)(Page);
```

Options of `withAsyncActions` can do dispatch reqeusy and reset events for you.

Usage example of `autoUpdate`, `autoFetch` and `autoReset` options:
```javascript
import { withAsyncActions } from 'experium-modules';
import { getUser } from './actions';

const User = ({ getUser }) => (
    <div>
        { getUser.meta.success && getUser.data.name }
    </div>
);

const propsToAction = ({ id }) => ({
    getUser: getUser.withParams({ id }).withPayload((props) => props.id)
});

const options = {
    autoFetch: true,
    autoUpdate: true,
    autoReset: true
};

const UserWithAsync = withAsyncActions(propsToAction, options)(User);
```
This example component call `getUser.dispatch` on componentWillMount.
You can have any count of `UserWithAsync` on page with different data becouse they stored by params path of id,
but if you have two components with same id its bind to one source of data.
If `props.id` of `UserWithAsync` component changed asyncClient reset data by previous id and fetch with new id.
On componentWillUnmount component call `getUser.reset` and data by this component `props.id` removed from store.

#### `withAsyncHandlers(actionsHandlers: {})` HOC
`withAsyncHandlers` HOC creates component with handlers which would executes only if component is mount. It binds for action from parent props or if item of actionsHandlers is action.

```javascript
import { withAsyncHandlers } from 'experium-modules';
import { postUser } from './actions';

const UserList = () => (
    <div>
        User List Component with Modal
    </div>
);

const UserWithAsync = withAsyncHandlers({
    postUser: postUser.withSuccessHandler(props => console.log('user updated'))
})(UserList);
```

#### `withSagas(sagas: [])` HOC
`withSagas` HOC creates component with sagas which would executes only if component is mount.

```javascript
import { withSagas } from 'experium-modules';

const Component = () => (
    <div>Component</div>
);

const UserWithAsync = withSagas([function* (getProps) {
    yield take(ACTION);
    yield take(ACTION_SUCCESS);
}])(Component);
```

# Action Helpers
#### `toError(actionType)`
#### `toRequest(actionType)`
#### `toSuccess(actionType)`
#### `toReset(actionType)`
#### `toLoad(actionType)`
Return action type name with state.
* `actionType (string)` - action type name

Usage example:
```javascript
import { toSuccess } from 'experium-modules';

const GET_USER_SUCCESS = toSuccess('GET_USER');
```
#### `createAction(type, staticPayload)`
Return action.
* `type (String)` - action name
* `staticPayload (Any)` - static payload

Usage example:
```javascript
import { createAction } from 'experium-modules';

const action = createAction('GET_USER');
```

You can pass additional attributes to action.

Example:
```javascript
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { getUser } from './getUser';

const Page = () => <div>Page</div>;

const dispatchToProps = (dispatch, props) => bindActionCreators({
    getUser: payload => getUser(payload, { id: props.id });
});

Page = connect(null, dispatchToProps)(Page);
```

#### `setActionHandler(type, handler)`
Add handler for action.
* `type (String)` - action type name
* `handler (Function)` - hadler for action

Usage example:
```javascript
import { setActionHandler } from 'experium-modules';
import axios from 'axios';

const handler = () => axios.get('/user');

setActionHandler('GET_USER', handler);
```

# Redux Utils
#### `requestGenerator(actionFn, action)`
Сreates the task that will perform the asynchronous action.

* `actionFn (Function)` - action creator
* `action (Object)` - action

Usage example:
```javascript
import { takeEvery } from 'redux-saga/effects';
import { requestGenerator } from 'experium-modules';

const fetchUserActionCreator = (payload, attrs) => {
    ...
};

function* watchFetchUser() {
    yield takeEvery('USER_REQUESTED', requestGenerator, fetchUserActionCreator);
}
```
