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

  render () {
    return (
      <div className={styles.mainview}>
        <video ref={(v) => { this.video = v; }} controls="1" />
      </div>
    )
  }
}
