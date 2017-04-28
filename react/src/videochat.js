import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import App from './containers/VideoChatApp'

// react-reduct
import store from './containers/VideoChatApp/store'
import { Provider } from 'react-redux';

let root = document.getElementById('root');

const render = Component => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer>
        <Component/>
      </AppContainer>
    </Provider>
    , document.getElementById('root')
  )
}

// stop pre-loader animation
document.body.className += ' loaded';

// render App
setTimeout(() => {
  root.className += ' fadeIn';
  render(App)
}, 700)

if (module.hot) {
  module.hot.accept('./containers/VideoChatApp', () => { render(App) })
}
