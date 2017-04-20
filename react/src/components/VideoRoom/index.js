import React from 'react'
import { styles } from '../Display/styles.scss'

export default class VideoView extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
        <div className={styles}>
            <div className="left">left</div>
            <div className="right">
                <div>users</div>
                <div>map</div>
            </div>
        </div>
        )
  }
}
