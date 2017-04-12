import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import map from './map'

const rootReducer = combineReducers({
  routing: routerReducer,
    /* your reducers */
  map
})

export default rootReducer
