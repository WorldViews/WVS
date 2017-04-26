import React from 'react'
import PropTypes from 'prop-types';

import WVL from 'Leaflet/WVLeaflet'
import { chatSelectUser } from 'actions/chat';
import { viewsUpdateLeft, viewsSetMediaUrl } from 'actions/views';
import { connect } from 'react-redux';
import Config from 'config';
import TrackViewer from 'components/Viewer';
import _ from 'lodash';

class MapView extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    dispatch: PropTypes.func,
    maximizePanel: PropTypes.string,
    users: PropTypes.array
  };

  static stateToProps(state, props) {
    return {
        maximizePanel: state.views.maximizePanel,
        users: state.chat.users
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
    WVL.registerDeviceClickWatcher(this.onDeviceClickWatcher.bind(this));
  }

  componentWillUpdate(nextProp) {
    if (nextProp.maximizePanel == 'right') {
      WVL.map.invalidateSize();
    }
  }

  onDeviceClickWatcher(clientId, clientType, info) {
    let type = 'webrtc';
    let url = 'janus://' + clientId;
    if (clientId === 'drone' || clientId === 'Drone') {
      clientType = 'drone';
    }
    switch (clientType) {
      case 'android':
        if (info.videoType === '360')
          type = 'webrtc-360';
        break;
      case 'drone':
        type = 'webrtc-drone';
        break;
      default:
        type = 'webrtc';
    }
    let user = _.find(this.props.users, {'display': clientId});
    this.props.dispatch(chatSelectUser(user));
    this.props.dispatch(viewsSetMediaUrl(url, type));
    this.props.dispatch(viewsUpdateLeft(<TrackViewer/>));
  }

  onWatchTrack(track, trec, e) {
    //this.props.dispatch(mapSelectTrack({track, trec}));
    let ytid = _.get(track, 'desc.youtubeId');
    if (ytid) {
      let url = 'https://www.youtube.com/watch?v=' + ytid;
      this.props.dispatch(viewsSetMediaUrl(url, 'youtube'));
      this.props.dispatch(viewsUpdateLeft(<TrackViewer/>));
    }
  }

  render () {
    return (
            <div ref={(map) => { this.map = map; }} id="map" className={this.props.className}></div>
    )
  }
}

export default connect(MapView.stateToProps)(MapView);

