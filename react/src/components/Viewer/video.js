import React from 'react'
import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
import styles from './styles.scss'

import Tooltip from 'react-tooltip'
import io from 'socket.io-client'

let socket = io.connect('https://sd6.dcpfs.net:6443/');

export default class VideoView extends React.Component { // eslint-disable-line react/prefer-stateless-function
  static propTypes = {
    className: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
    stream: PropTypes.object
  };

  constructor(props) {
      super(props);
  }

  attachStream(stream) {
      if (!this.video) {
        return;
      }

      if (stream) {
        this.video.srcObject = stream;
        this.video.muted = true;
        this.video.play();
      } else {
        this.video.srcObject = null;
      }
    //   this.refs.video.src = URL.createObjectURL(stream);
  }

  update(props) {
    if (props.stream) {
      this.attachStream(props.stream);
    }
    if (props.url) {
      this.video.src = props.url;
    }
  }

  componentDidMount() {
    this.update(this.props);
  }

  componentWillUpdate(nextProps, nextState) {
    this.update(nextProps);
  }

  onDroneChange(command) {
    socket.emit('command', 'up');
  }

  render () {
    return (
      <div className={styles.mainview}>
        <video ref={(v) => { this.video = v; }} controls="1" />
        <canvas ref={(c) => { this.canvas = c; }} />
          {}
        <div className={"drone form-group" + (this.props.type !== 'drone' ? ' hidden' : '')} >
          <Tooltip place="right" type="info" effect="solid"/>
          <a className="btn btn-up btn-primary btn-sm"
            data-tip="Move drone camera up"
            onClick={() => this.onDroneChange('up') }>
              <i className="glyphicon glyphicon-chevron-up"/>
            </a>
          <a className="btn btn-center btn-primary btn-sm"
            data-tip="Center drone camera"
            onClick={() => this.onDroneChange('reset') }>
            <i className="glyphicon glyphicon glyphicon-stop"/>
            </a>
          <a className="btn btn-down btn-primary btn-sm"
          data-tip="Move drone camera down"
            onClick={() => this.onDroneChange('down') }>
              <i className="glyphicon glyphicon-chevron-down"/>
            </a>
        </div>
      </div>
    )
  }
}

// function mapStateToProps(state, props) {
//     return {
//         stream: state.chat.mainStream
//      };
// }

// export default connect(mapStateToProps)(VideoView);
