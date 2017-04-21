import React from 'react'
import PropTypes from 'prop-types'

// application components
import VideoRoom from 'components/VideoRoom'

// global styles for app
// import styles from './styles.scss'

export default class App extends React.Component { // eslint-disable-line react/prefer-stateless-function
  static propTypes = {
    children: PropTypes.node
  };

  constructor(props) {
      super(props);
  }

  render () {
    return (
        <VideoRoom/>
    )
  }
}
