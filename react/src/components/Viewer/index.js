import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import YoutubeViewer from './youtube';
import VideoViewer from './video';
import _ from 'lodash'
import styles from './styles.scss'

class Viewer extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    track: PropTypes.object,
    mediaUrl: PropTypes.object,
    mediaType: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.element = (<div>No Viewer</div>);
  }

  static stateToProps(state) {
    return {
      mediaUrl: state.views.mediaUrl,
      mediaType: state.views.mediaType,
      track: state.map.selectedTrack
    }
  }

  youtubeUrlParser(url){
    if (typeof url === 'string') {
      let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      let  match = url.match(regExp);
      return (match && match[7].length==11)? match[7] : false;
    }
    return false;
  }

  parseUrl(url, props) {
    if (props.track) {
      return 'youtube';
    }

    if (typeof url === 'string') {
      let ytid = this.youtubeUrlParser(url);
      if (ytid) {
        return 'youtube';
      } else {
        return 'video';
      }
    } if (typeof url === 'object') {
      // media stream url
      switch (props.mediaType) {
        case '360':
          return 'webrtc-360';
        case 'drone':
          return 'webrtc-drone';
        default:
          return 'webrtc'
      }
    }
    return null;
  }

  update(props) {
    let url = props.mediaUrl;
    let type = this.parseUrl(url, props);
    switch (type) {
      case 'youtube': {
        let ytid = this.youtubeUrlParser(url, props) || _.get(props, 'track.track.desc.youtubeId');
        this.element = <YoutubeViewer className={this.props.className} id={ytid} />;
        break;
      }
      case 'video': {
        this.element = <VideoViewer className={this.props.className} url={url} />;
        break;
      }
      case 'webrtc-360': {
        this.element = <VideoViewer className={this.props.className} stream={url} type="360" />;
        break;
      }
      case 'webrtc-drone': {
        this.element = <VideoViewer className={this.props.className} stream={url} type="drone" />;
        break;
      }
      case 'webrtc': {
        this.element = <VideoViewer className={this.props.className} stream={url} />;
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
