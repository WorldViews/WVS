import React from 'react'
import PropTypes from 'prop-types';
// import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import WVL from 'Leaflet/WVLeaflet'
import { mapSelectTrack } from 'actions/map';
import { connect } from 'react-redux';
import Config from 'config';

class MapView extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    dispatch: PropTypes.func
  };

  static stateToProps(state, props) {
    return {
    }
  }

  componentDidMount () {
    var latlng = { lat: 37.324684179870715, lng: -122.0436295866966 }
    var bounds = [
            [ 37.0, -123.04150527715686 ],
            [ 38, -120.04593628644945 ]
    ]

    if (Config.mapSocketioUrl) {
      WVL.SIO_URL = Config.mapSocketioUrl;
    }
    console.log("SIO_URL = " + WVL.SIO_URL);

    WVL.initmap(latlng, bounds);
    WVL.loadTracksFromFile(WVL.toursUrl);
    WVL.watchPositions();

    WVL.registerTrackWatcher(this.onWatchTrack.bind(this));
  }

  onWatchTrack(track, trec, e) {
    this.props.dispatch(mapSelectTrack(track));
  }

  // componentDidUpdate(prevProps, prevState, prevContext) {
  //   WVL.map.invalidateSize();
  // }

  // resize (layout) {
  //   switch (layout) {
  //     case 'left':
  //       break
  //     case 'right':
  //       break
  //   }
  //   WVL.map.invalidateSize();
  // }

  // componentWillUpdate() {
  //   WVL.map.invalidateSize();
  // }

  render () {
    return (
            <div ref={(map) => { this.map = map; }} id="map" className={this.props.className}></div>
    )
  }
}

export default connect(MapView.stateToProps)(MapView);

