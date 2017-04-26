import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { chatSelectUser } from 'actions/chat'
import { viewsUpdateLeft, viewsSetMediaUrl } from 'actions/views'
import styles from './styles.scss'
import VideoView from 'components/Viewer'
import Icon from 'react-icons-kit';
import { ic_face } from 'react-icons-kit/md/ic_face';
import _ from 'lodash';

class UserList extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    users: PropTypes.array,
    dispatch: PropTypes.func
  };

  static stateToProps(state, props) {
    return {
        users: state.chat.users
     };
  }

  onClick(user) {
      //let stream = user.stream;
      this.props.dispatch(chatSelectUser(user));
      this.props.dispatch(viewsUpdateLeft(<VideoView />));
      let url = 'janus://' + user.display;
      let type = 'webrtc';

      if (user.display.match(/[Dd]rone/)) {
          type = 'webrtc-drone';
      }

      let videoType = _.get(user, 'status.videoType');
      if (videoType === '360') {
          type = 'webrtc-360';
      }

      this.props.dispatch(viewsSetMediaUrl(url, type));
  }

  render () {
    return (
            <section className={[this.props.className, styles.userlist].join(' ')}>
                {this.props.users.map((u, i) => {
                    return (
                        <div className="avatar" key={u.id} onClick={() =>  this.onClick(u)}>
                            {(u.status && u.status.picture) ?
                                    <img className="thumbnail" src={u.status.picture} /> :
                                    <Icon className="thumbnail" size={100} icon={ic_face} />}
                            <div className="username">{u.display}</div>
                        </div>
                    )
                })}
            </section>
    )
  }
}

export default connect(UserList.stateToProps)(UserList);
