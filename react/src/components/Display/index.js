import React from 'react'

/* component styles */
import { styles } from './styles.scss'

import Viewer from '../Viewer'
import Map from '../Map'
import WVL from 'Leaflet/WVLeaflet'

export default class DisplayView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      layout: ''
    }
  }

  changeLayout (layout) {
    if (layout === 'left') {
      this.setState({layout: 'left-max'})
    } else if (layout === 'right') {
      this.setState({layout: 'right-max'})
    } else {
      this.setState({layout: ''})
    }
    setTimeout(() => WVL.map.invalidateSize(), 500);
  }

  render () {
    return (
        <div className={[styles, this.state.layout].join(' ')}>
            <Viewer className="left" />
            <Map ref={ (map) => { this.map = map; }} className="right" />
            <div className="controls">
                <div className="btn-group" role="group">
                    <button type="button" className="btn btn-default" onClick={() => this.changeLayout('left')}>Left</button>
                    <button type="button" className="btn btn-default" onClick={() => this.changeLayout('default')}>Middle</button>
                    <button type="button" className="btn btn-default" onClick={() => this.changeLayout('right')}>Right</button>
                </div>
            </div>
        </div>
    )
  }
}
