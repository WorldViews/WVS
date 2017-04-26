import React from 'react'
import PropTypes from 'prop-types';

import WVYT from 'WVYT2'
import WVL from 'Leaflet/WVLeaflet'
import { connect } from 'react-redux';

class YoutubeViewer extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    track: PropTypes.object,
    trec: PropTypes.object
  };

  static stateToProps(state, props) {
      return {
          track: state.map.selectedTrack,
          trec: state.map.selectedTrec
      }
  }

  onWatchYTStat (stat) {
    if (!WVL.currentTrack) {
            // console.log("watchYTStat No current track");
      return
    }
    var desc = WVL.currentTrack.desc
        // console.log("watchYTStat desc: "+JSON.stringify(desc));
    var vt = stat.t
    var trailTime = vt - desc.youtubeDeltaT
        // console.log("watchYTStat vt: "+vt+"   trailTime: "+trailTime);
    WVL.setPlayTime(trailTime)
  }

  onWatchTrackEvent (track, trec, e) {
    console.log('----------------------')
    console.log('trec: ' + trec)
    var t = trec.rt
    console.log('t: ' + t)
    var desc = track.desc
    var videoId = desc.youtubeId
    var deltaT = desc.youtubeDeltaT
    WVL.setCurrentTrack(track)
    WVL.setPlayTime(t)
    var vt = t + deltaT
    if (vt < 0) { vt = 0 }
    console.log('vt: ' + vt)
    WVYT.playVideo(videoId, {t: vt})
        //   WVYT.setPlayTime(vt);
  }

  componentWillUnmount() {
    WVYT.player.stopVideo();
    WVYT.player.destroy();
    WVYT.player = null;
  }

  componentDidMount () {
    //var youtubeId = 'f5e_4iIFzU8'
    WVYT.videoId = this.props.id;
    WVYT.divId = 'youtube';

    WVL.registerTrackWatcher((track, trec, e) => this.onWatchTrackEvent(track, trec, e))
    WVYT.registerWatcher((stat) => this.onWatchYTStat(stat))
    WVYT.start();

    if (this.props.track && this.props.trec) {
        this.onWatchTrackEvent(this.props.track, this.props.trec);
    }
  }

  componentWillUpdate() {
  }

  render () {
    return (
        <div id="youtube" className={this.props.className}></div>
    )
  }
}


export default connect(YoutubeViewer.stateToProps)(YoutubeViewer);
