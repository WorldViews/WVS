import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import App from './containers/VideoChatApp'

// react-reduct
import store from './containers/VideoChatApp/store'
import { Provider } from 'react-redux';

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

render(App)

if (module.hot) {
  module.hot.accept('./containers/VideoChatApp', () => { render(App) })
}
