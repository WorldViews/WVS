import React from 'react'
// import Icon from 'react-icons-kit';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from './styles.scss';
import { chatSendTextMessage, chatShowTextChat, chatClearTextMessages } from 'actions/chat';
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

    scrollMessagesToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    componentDidUpdate() {
        if (this.props.showTextChat) {
            this.input.focus();
        }
    }

    onKeyPress(e) {
        if (e.key === 'Enter') {
            let msg = e.target.value;
            e.target.value = "";
            this.props.dispatch(chatSendTextMessage(msg));
            console.log('msg = ' + msg)
            this.scrollMessagesToBottom();
        }
    }

    onClearMessages() {
        this.props.dispatch(chatClearTextMessages());
    }

    onCloseMessages() {
        this.props.dispatch(chatShowTextChat(false));
    }

    render() {
        return (
            // <div className={`${styles.messages} ${ this.props.showTextChat ? '' : styles.hidden }`}>
            //<div className={styles.messages + ' ' + (this.props.showTextChat ? styles.shown : styles.hidden) }>
            <div className={styles.messages + ' ' + (this.props.showTextChat ? styles.shown : '') }>
                <div className="messages" ref={(m) => { this.messages = m }}>
                    {this.props.messages.map((message,i) => {
                        let ts = ((message.ts || Date.now())/ 1000);
                        return <div className={styles.message} key={i}>
                            <div>
                                <label className="name">{message.user}</label>
                                <span className="timestamp">
                                    <i className="glyphicon glyphicon-time"/>
                                    &nbsp; <Timestamp time={ ts } />
                                </span>
                            </div>
                            <div className="text">{message.text}</div>
                        </div>
                    })}
                </div>
                <div className={styles.textinput}>
                    <input ref={(i) => {this.input = i}} type="text" className="form-control" placeholder="Write a message..."
                            onKeyPress={this.onKeyPress.bind(this) } />
                    <a className="form-control btn btn-primary" onClick={this.onClearMessages.bind(this)}>
                        <i className="glyphicon glyphicon-trash"></i>
                    </a>
                    <a className="form-control btn btn-info" onClick={this.onCloseMessages.bind(this)}>
                        <i className="glyphicon glyphicon-chevron-left"></i>
                    </a>
                </div>
            </div>
        );
    }
}

export default connect(TextChatView.stateToProps)(TextChatView);
