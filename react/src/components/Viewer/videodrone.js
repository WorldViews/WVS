import React from 'react'
import styles from './styles.scss'

import Tooltip from 'react-tooltip'
import io from 'socket.io-client'
import VideoViewer from './video'

let socket = io.connect('https://worldviews.org/');

export default class VideoDroneView extends VideoViewer { // eslint-disable-line react/prefer-stateless-function

  onDroneChange(command) {
    socket.emit('command', 'up');
  }

  render () {
    return (
      <div className={styles.mainview}>
        <video ref={(v) => { this.video = v; }} controls="1" />
        <div className={"drone form-group drone"} >
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
