import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from './styles.scss';

import Map from 'components/Map'
import UserList from './userlist'
// import VideoView from './videoview'
import Toolbar from 'components/Toolbar'
import Instructions from './instructions'
import TextChatView from 'components/TextChatView'

class VideoRoom extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    leftView: PropTypes.node,
    maximizePanel: PropTypes.string,
  }

  static stateToProps(state, props) {
    return {
        leftView: state.views.leftView,
        maximizePanel: state.views.maximizePanel
     };
  }

  getMaxPanelClass() {
    switch (this.props.maximizePanel) {
      case 'left':
        return 'left-max';
      case 'right':
        return 'right-max';
      default:
        return '';
    }
  }

  render () {
    return (
        <content className={`${styles.container} ${this.getMaxPanelClass()}`}>
            <Toolbar/>
            <TextChatView />
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
