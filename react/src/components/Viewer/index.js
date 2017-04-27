import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import YoutubeViewer from './youtube'
import VideoViewer from './video'
import Video360Viewer from './video360'
import VideoDroneViewer from './videodrone'

import styles from './styles.scss'
import { janusClient } from 'actions/chat'
import NoVideo from './novideo'

class Viewer extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    mediaUrl: PropTypes.string,
    mediaType: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.element = (<div>No Viewer</div>);
  }

  static stateToProps(state) {
    return {
      mediaUrl: state.views.mediaUrl,
      mediaType: state.views.mediaType
    }
  }

  static youtubeUrlParser(url){
    if (typeof url === 'string') {
      let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      let  match = url.match(regExp);
      return (match && match[7].length==11)? match[7] : false;
    }
    return false;
  }

  static janusUrlParser(url) {
    let regExp = /^janus:\/\/([^#\&\?]*)/;
    let match = url.match(regExp);
    let username = (match && match[1]);
    let stream = janusClient.getStream(username);
    return stream;
  }

  streamHasVideo(stream) {
      if (stream) {
          return stream.getVideoTracks().length > 0;
      }
      return false;
  }

  update(props) {
    let url = props.mediaUrl;
    let type = props.mediaType;
    let stream = null;
    switch (type) {
      case 'youtube': {
        let ytid = Viewer.youtubeUrlParser(url);
        this.element = <YoutubeViewer className={this.props.className} id={ytid} />;
        break;
      }
      case 'video': {
        this.element = <VideoViewer className={this.props.className} url={url} />;
        break;
      }
      case 'webrtc': {
        stream = Viewer.janusUrlParser(url);
        if (this.streamHasVideo(stream))
            this.element = <VideoViewer className={this.props.className} stream={stream} type={type} />;
        else
            this.element = <NoVideo className={this.props.className} />
        break;
      }
      case 'webrtc-360': {
        stream = Viewer.janusUrlParser(url);
        if (this.streamHasVideo(stream))
          this.element = <Video360Viewer className={this.props.className} stream={stream} />;
        else
          this.element = <NoVideo className={this.props.className} />
        break;
      }
      case 'webrtc-drone': {
        stream = Viewer.janusUrlParser(url);
        if (this.streamHasVideo(stream))
          this.element = <VideoDroneViewer className={this.props.className} stream={stream} />;
        else
          this.element = <NoVideo className={this.props.className} />
        break;
      }
      default:
        this.element = <div className={[this.props.className, styles.novideo].join(' ')}>
          <h1>Please select a track</h1>
        </div>;
        break;
    }
  }

  componentWillMount() {
    this.update(this.props);
  }


  componentWillUpdate(props) {
    this.update(props);
  }

  render() {
    return this.element;
  }
}

export default connect(Viewer.stateToProps)(Viewer);
