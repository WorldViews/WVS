import React from 'react'
// import Icon from 'react-icons-kit';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from './styles.scss';
import { chatSendTextMessage } from 'actions/chat';
import Timestamp from 'react-timestamp';

class TextChatView extends React.Component {

    static propTypes = {
        showTextChat: PropTypes.bool,
        messages: PropTypes.array,
        dispatch: PropTypes.func
    }

    static stateToProps(state) {
        return {
            showTextChat: state.chat.showTextChat,
            messages: state.chat.messages || [],
        };
    }

    onKeyPress(e) {
        if (e.key === 'Enter') {
            let msg = e.target.value;
            e.target.value = "";
            this.props.dispatch(chatSendTextMessage(msg));
            console.log('msg = ' + msg)
        }
    }

    render() {
        return (
            // <div className={`${styles.messages} ${ this.props.showTextChat ? '' : styles.hidden }`}>
            //<div className={styles.messages + ' ' + (this.props.showTextChat ? styles.shown : styles.hidden) }>
            <div className={styles.messages + ' ' + (this.props.showTextChat ? styles.shown : '') }>
                <div className="messages">
                    {this.props.messages.map((message) => {
                        return <div className={`${styles.message}`}>
                            <div>
                                <label className="name">{message.user}</label>
                                <span className="timestamp">
                                    <i className="glyphicon glyphicon-time"/>
                                    <Timestamp time={(message.ts || Date.now())/1000} />
                                </span>
                            </div>
                            <div className="text">{message.text}</div>
                        </div>

                    })}
                </div>
                <div className="form-group">
                    <input type="text" className="form-control" placeholder="Write a message..."
                        onKeyPress={this.onKeyPress.bind(this) } />
                </div>
            </div>
        );
    }
}

export default connect(TextChatView.stateToProps)(TextChatView);
