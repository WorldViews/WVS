import React from 'react'
import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
import styles from './styles.scss'

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

  update() {
    if (this.props.stream) {
      this.attachStream(this.props.stream);
    }
    if (this.props.url) {
      this.video.src = this.props.url;
    }
  }

  componentDidMount() {
    this.update();
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (nextProps) {
  //       this.attachStream(nextProps.stream);
  //   }
  //   return true;
  // }

  componentWillUpdate() {
    this.update();
  }

  render () {
    return (
      <div className={styles.mainview}>
        <video ref={(v) => { this.video = v; }} controls="1" />
        <canvas ref={(c) => { this.canvas = c; }} />
        <div className="drone form-group">
          <a className="btn btn-up btn-primary btn-sm"
            onClick={() => this.onDroneChange('up') }>Up</a>
          <a className="btn btn-center btn-primary btn-sm"
            onClick={() => this.onDroneChange('center') }>Center</a>
          <a className="btn btn-down btn-primary btn-sm"
            onClick={() => this.onDroneChange('down') }>Down</a>
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
