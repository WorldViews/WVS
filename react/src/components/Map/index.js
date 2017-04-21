import React from 'react'
import PropTypes from 'prop-types';

import WVL from 'Leaflet/WVLeaflet'
import { mapSelectTrack } from 'actions/map';
import { viewsUpdateLeft } from 'actions/views';
import { connect } from 'react-redux';
import Config from 'config';
import TrackViewer from 'components/Viewer';

class MapView extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    dispatch: PropTypes.func,
    maximizePanel: PropTypes.string
  };

  static stateToProps(state, props) {
    return {
        maximizePanel: state.views.maximizePanel
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

  componentWillUpdate(nextProp) {
    if (nextProp.maximizePanel == 'right') {
      WVL.map.invalidateSize();
    }
  }

  onWatchTrack(track, trec, e) {
    this.props.dispatch(mapSelectTrack({track, trec}));
    this.props.dispatch(viewsUpdateLeft(<TrackViewer/>));
  }

  render () {
    return (
            <div ref={(map) => { this.map = map; }} id="map" className={this.props.className}></div>
    )
  }
}

export default connect(MapView.stateToProps)(MapView);

