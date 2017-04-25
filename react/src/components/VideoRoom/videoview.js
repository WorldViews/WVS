import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import styles from './styles.scss'

class VideoView extends React.Component { // eslint-disable-line react/prefer-stateless-function
  static propTypes = {
    className: PropTypes.string,
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

  componentDidMount() {
    if (this.props.stream) {
      this.attachStream(this.props.stream);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps) {
        this.attachStream(nextProps.stream);
    }
    return true;
  }

  render () {
    return (
      <video ref={(v) => { this.video = v; }} className={this.props.className}></video>
            /*<section className={[ this.props.className, styles.video ].join(' ')}>
                <video ref="video"></video>
            </section>*/
    )
  }
}

function mapStateToProps(state, props) {
    return {
        stream: state.chat.mainStream
     };
}

export default connect(mapStateToProps)(VideoView);
