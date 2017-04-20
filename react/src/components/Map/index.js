import React from 'react'
import PropTypes from 'prop-types';
// import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import WVL from 'Leaflet/WVLeaflet'

export default class MapView extends React.Component {

  static propTypes = {
    className: PropTypes.string
  };

  componentDidMount () {
    var latlng = { lat: 37.324684179870715, lng: -122.0436295866966 }
    var bounds = [
            [ 37.0, -123.04150527715686 ],
            [ 38, -120.04593628644945 ]
    ]
    WVL.initmap(latlng, bounds);
    WVL.loadTracksFromFile(WVL.toursUrl);
    WVL.watchPositions();  
  }

  resize (layout) {
    switch (layout) {
      case 'left':
        break
      case 'right':
        break
    }
    WVL.map.invalidateSize();
  }

  componentWillUpdate() {
    WVL.map.invalidateSize();
  }

  render () {
    return (
            <div id="map" className={this.props.className}></div>
    )
  }
}
