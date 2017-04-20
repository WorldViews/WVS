import React from 'react'
import PropTypes from 'prop-types'

// application components
import Header from 'components/Header'
import Footer from 'components/Footer'

import Map from 'components/Map'
import UserList from 'components/VideoRoom/userlist'
import VideoView from 'components/VideoRoom/videoview'
import Toolbar from 'components/Toolbar'

// global styles for app
import styles from './styles.scss'

export default class App extends React.Component { // eslint-disable-line react/prefer-stateless-function
  static propTypes = {
    children: PropTypes.node
  };

  constructor(props) {
      super(props);
  }

  render () {
    return (
        <section className={styles.box}>
            <Header />
            <content className={styles.container}>
                <Toolbar/>
                <VideoView className="left" />
                <div className="right">
                    <UserList/>
                    <Map className="fill"/>
                </div>
            </content>
            <Footer />
        </section>
    )
  }
}
