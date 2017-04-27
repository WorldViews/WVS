import React from 'react'
import PropTypes from 'prop-types'
import { ModalContainer, ModalDialog } from 'react-modal-dialog'
import { connect } from 'react-redux'
import { chatPromptUsername, chatConnect} from 'actions/chat'

class NamePromptDialog extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        show: PropTypes.bool,
        dispatch: PropTypes.func
    }

    static stateToProps(state) {
        return {}
    }

    state = {
        username: "",
        errorMessage: null
    }

    onClose() {
        this.props.dispatch(chatPromptUsername(false));
    }

    isValid(username) {
        var usernameRegex = /^[a-zA-Z0-9]+$/;
        return  (username.match(usernameRegex)) ? true : false;
    }

    onChange(event) {
        this.setState({username: event.target.value});
    }

    onConnect() {
        if (this.isValid(this.state.username)) {
            this.onClose();
            this.props.dispatch(chatConnect(this.state.username));
        } else if (this.state.username.length > 20) {
            this.setState({
                errorMessage: 'Username too long. Please enter less than 20 characters'
            });
        } else if (this.state.username.length > 1) {
            this.setState({
                errorMessage: 'Please enter only alpha numberic without spaces'
            });
        } else {
            this.setState({
                errorMessage: 'Please enter a username'
            });
        }
    }

    render() {
        return (
            <div>
            {
                this.props.show &&
                <ModalContainer onClose={this.onClose.bind(this)}  zIndex={2000}>
                    <ModalDialog onClose={this.onClose.bind(this)} width={400} className={this.props.className}>
                        <h2>What's your name?</h2>
                        { this.state.errorMessage &&
                        <div className="alert alert-danger">
                            <i className="glyphicon glyphicon-exclamation-sign" /> &nbsp;
                            {this.state.errorMessage}
                        </div>}
                        <div className="form-group">
                            <input className="form-control"
                                value={this.state.username}
                                onChange={this.onChange.bind(this)}
                                placeholder="Username" name="username"/>
                        </div>
                        <div className="form-group">
                            <a className="btn btn-info form-control" onClick={this.onConnect.bind(this)}>Join</a>
                        </div>
                    </ModalDialog>
                </ModalContainer>
            }
            </div>
        )
    }
}

export default connect(NamePromptDialog.stateToProps)(NamePromptDialog);