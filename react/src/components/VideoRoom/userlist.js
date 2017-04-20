import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { chatSelectUser } from 'actions/chat'
import styles from './styles.scss'

class UserList extends React.Component { // eslint-disable-line react/prefer-stateless-function
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    users: PropTypes.array,
    dispatch: PropTypes.func
  };

  constructor(props) {
      super(props);
  }

  onClick(user) {
      console.log('click')
      this.props.dispatch(chatSelectUser(user));
  }

  render () {
    return (
            <section className={[this.props.className, styles.userlist].join(' ')}>
                {this.props.users.map((u, i) => {
                    return (
                        <div className="avatar" onClick={() =>  this.onClick(u)}>
                            <img className="thumbnail" />
                            <div className="username">{u.username}</div>
                        </div>
                    )
                })}
            </section>
    )
  }
}

function mapStateToProps(state, props) {
    return {
        users: state.chat.users
     };
}

export default connect(mapStateToProps)(UserList);
