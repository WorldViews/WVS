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
// import { microphoneSlash } from 'react-icons-kit/fa/microphoneSlash';
import { comments } from 'react-icons-kit/fa/comments';

import { youtubePlay } from 'react-icons-kit/fa/youtubePlay';
import { globe } from 'react-icons-kit/fa/globe';
import { trello } from 'react-icons-kit/fa/trello';

import { chatPromptUsername, chatDisconnect, chatEnableAudio, chatEnableVideo, chatShowTextChat } from 'actions/chat';
import { viewsMaximizePanel, viewsResetPanels, viewsUpdateLeft } from 'actions/views';
import InstructionsView from 'components/VideoRoom/instructions'

class Toolbar extends React.Component {

  static propTypes = {
    connected: PropTypes.bool,
    enableAudio: PropTypes.bool,
    enableVideo: PropTypes.bool,
    showTextChat: PropTypes.bool,
    viewType: PropTypes.string,
    dispatch: PropTypes.func
  }

  static stateToProps(state, props) {
    return {
        connected: state.chat.connected,
        enableAudio: state.chat.enableAudio,
        enableVideo: state.chat.enableVideo,
        showTextChat: state.chat.showTextChat,
        viewType: state.views.viewType
    };
  }

  onMenuToggle() {

  }

  onConnectToggle() {
    if (this.props.connected) {
        this.props.dispatch(chatDisconnect());
        this.props.dispatch(viewsUpdateLeft(<InstructionsView/>));
    } else {
        this.props.dispatch(chatPromptUsername(true));
    }
  }

  onVideoToggle() {
      this.props.dispatch(chatEnableVideo(!this.props.enableVideo));
  }

  onAudioToggle() {
      this.props.dispatch(chatEnableAudio(!this.props.enableAudio));
  }

  onMaximizeViewer() {
      this.props.dispatch(viewsMaximizePanel('left'));
  }

  onMaximizeMap() {
      this.props.dispatch(viewsMaximizePanel('right'));
  }

  onResetView() {
      this.props.dispatch(viewsResetPanels());
  }

  onToggleTextChat() {
      this.props.dispatch(chatShowTextChat(!this.props.showTextChat));
  }

  render () {
    return (
      <section className={styles}>
        <Tooltip place="right" type="info" effect="solid"/>
        <Icon icon={bars}
            className="icon-header icon-padding" onClick={this.onMenuToggle.bind(this)}/>

        { (this.props.viewType === 'private') ? (
        <div>
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

            <Icon icon={comments}
                data-tip={this.props.showTextChat ?  "Hide Text Chat" : "Show Text Chat"}
                className="icon icon-padding"
                onClick={this.onToggleTextChat.bind(this)}/>
        </div>
        ) : null}


        <Icon icon={youtubePlay}
            data-tip={"Maximize Video Viewer"}
            className={"icon"}
            onClick={this.onMaximizeViewer.bind(this)}/>
        <Icon icon={globe}
            data-tip={"Maximize Map"}
            className={"icon"}
            onClick={this.onMaximizeMap.bind(this)}/>
        <Icon icon={trello}
            data-tip={"Reset View"}
            className={"icon"}
            onClick={this.onResetView.bind(this)}/>


      </section>
    )
  }
}

export default connect(Toolbar.stateToProps)(Toolbar);
