import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import map from './map'
import chat from './chat'

const rootReducer = combineReducers({
  routing: routerReducer,
  /* your reducers */
  chat
});

export default rootReducer
