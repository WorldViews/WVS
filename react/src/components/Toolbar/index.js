import React from 'react'
import Icon from 'react-icons-kit';
import PropTypes from 'prop-types';
import Tooltip from 'react-tooltip'
import { connect } from 'react-redux';

/* component styles */
import { styles } from './styles.scss'
import { bars } from 'react-icons-kit/fa/bars';
import { phoneSquare } from 'react-icons-kit/fa/phoneSquare';
import { phoneHangUp } from 'react-icons-kit/icomoon/phoneHangUp';
import { videoCamera } from 'react-icons-kit/fa/videoCamera';
import { microphone } from 'react-icons-kit/fa/microphone';
import { microphoneSlash } from 'react-icons-kit/fa/microphoneSlash';

import { chatConnect, chatDisconnect, chatEnableAudio, chatEnableVideo } from 'actions/chat';

class Toolbar extends React.Component {

  static propTypes = {
    connected: PropTypes.bool,
    enableAudio: PropTypes.bool,
    enableVideo: PropTypes.bool,
    dispatch: PropTypes.func
  }

  static stateToProps(state, props) {
    return {
        connected: state.chat.connected,
        enableAudio: state.chat.enableAudio,
        enableVideo: state.chat.enableVideo
    };
  }

  onMenuToggle() {

  }

  onConnectToggle() {
    if (this.props.connected) {
        this.props.dispatch(chatDisconnect());
    } else {
        this.props.dispatch(chatConnect(9000));
    }
  }

  onVideoToggle() {
      this.props.dispatch(chatEnableVideo(!this.props.enableVideo));
  }

  onAudioToggle() {
      this.props.dispatch(chatEnableAudio(!this.props.enableAudio));
  }

  render () {
    return (
      <section className={styles}>
        <Tooltip place="right" type="info" effect="solid"/>
        <Icon icon={bars}
            className="icon menu" onClick={this.onMenuToggle.bind(this)}/>

        <Icon
            data-tip={this.props.connected ?  "Disconnect" : "Connect"}
            icon={this.props.connected ?  phoneHangUp : phoneSquare}
            className="icon"
            onClick={this.onConnectToggle.bind(this)}/>

        <Icon icon={videoCamera}
            data-tip={this.props.enableVideo ?  "Disable Camera" : "Enable Camera"}
            className={"icon" + ((this.props.enableVideo) ? "" : " disabled")}
            onClick={this.onVideoToggle.bind(this)}/>

        <Icon icon={microphone}
            data-tip={this.props.enableAudio ?  "Disable Microphone" : "Enable Microphone"}
            className={"icon" + ((this.props.enableAudio) ? "" : " disabled")}
            onClick={this.onAudioToggle.bind(this)}/>

      </section>
    )
  }
}

export default connect(Toolbar.stateToProps)(Toolbar);