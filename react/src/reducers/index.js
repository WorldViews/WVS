import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import map from './map'
import chat from './chat'
import views from './views'

const rootReducer = combineReducers({
  routing: routerReducer,
  /* your reducers */
  chat,
  map,
  views
});

export default rootReducer
