import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { chatSelectUser } from 'actions/chat'
import { viewsUpdateLeft } from 'actions/views'
import styles from './styles.scss'
import VideoView from './videoview'

class UserList extends React.Component { // eslint-disable-line react/prefer-stateless-function
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

  constructor(props) {
      super(props);
  }

  onClick(user) {
      console.log('click')
      this.props.dispatch(chatSelectUser(user));
      this.props.dispatch(viewsUpdateLeft(<VideoView />))
  }

  render () {
    return (
            <section className={[this.props.className, styles.userlist].join(' ')}>
                {this.props.users.map((u, i) => {
                    return (
                        <div className="avatar" key={u.id} onClick={() =>  this.onClick(u)}>
                            <img className="thumbnail" />
                            <div className="username">{u.username}</div>
                        </div>
                    )
                })}
            </section>
    )
  }
}

export default connect(UserList.stateToProps)(UserList);
