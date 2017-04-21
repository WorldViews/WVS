import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from './styles.scss';

import Map from 'components/Map'
import UserList from './userlist'
// import VideoView from './videoview'
import Toolbar from 'components/Toolbar'
import Instructions from './instructions'

class VideoRoom extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    leftView: PropTypes.node,
  }

  static stateToProps(state, props) {
    return {
        leftView: state.views.leftView
     };
  }

  render () {
    return (
        <content className={styles.container}>
            <Toolbar/>
            <div className="left">
            {this.props.leftView ? this.props.leftView : <Instructions />}
            </div>
            <div className="right">
                <UserList/>
                <Map className="fill"/>
            </div>
        </content>
        )
  }
}


export default connect(VideoRoom.stateToProps)(VideoRoom);
