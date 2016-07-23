
/*
  This is code for playing a youtube video in an Iframe.
  https://developers.google.com/youtube/iframe_api_reference#Requirements
 */

//if (!report)
//    report = function(str) { console.log(str); }
//function report(str) { console.log(str); }

WVYT = {}
WVYT.videoId = null;
WVYT.player = null;

WVYT.start = function()
{
    report("WVYT.start");
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
    report("onYouTubeIframeAPIReady");
    //var videoId = '3F41wcWmB5Y';
    if (WVYT.videoId == null)
	WVYT.videoId = 'M7lc1UVf-VE';
    //WVYT.setupYouTubePlayer(WVYT.videoId);
    WVYT.setupYouTubePlayer(WVYT.videoId, WV.youtubeWidget.divId);
}

WVYT.setupYouTubePlayer = function(videoId, divName)
{
    if (!divName)
	divName = 'ytplayer';
    divName = divName.replace("#","");
    report("setupYouTubePlayer "+videoId+" "+divName);
    //WVYT.player = new YT.Player('ytplayer', {
    WVYT.player = new YT.Player(divName, {
	    height: '390',
	    width: '640',
	    //videoId: 'M7lc1UVf-VE',
	    //videoId: '3F41wcWmB5Y',
	    videoId: videoId,
	    events: {
                'onReady': WVYT.onPlayerReady,
                'onStateChange': WVYT.onPlayerStateChange
	    }
    });
}

      // 4. The API will call this function when the video player is ready.
WVYT.onPlayerReady = function(event) {
        event.target.playVideo();
}

      // 5. The API calls this function when the player's state changes.
      //    The function indicates that when playing a video (state=1),
      //    the player should play for six seconds and then stop.
WVYT.done = false;

WVYT.onPlayerStateChange = function(event) {
    if (event.data == YT.PlayerState.PLAYING && !WVYT.done) {
	report("onPlayerStateChange "+event.data);
        //setTimeout(WVYT.stopVideo, 4000);
        WVYT.done = true;
    }
}

WVYT.stopVideo = function() {
    report("WVYT.stopVideo");
    WVYT.player.stopVideo();
}

WVYT.playVideo = function(id, rec)
{
    report("WVYT.playVideo "+id);
    WV.youtubeWidget.show();
    if (WVYT.videoId == id && WVYT.player && rec) {
	var t = rec.t;
	report("******* seek only ******** "+t);
	WVYT.player.seekTo(t, true);
	return;
    }
    WVYT.videoId = id;
    if (WVYT.player == null) {
	WVYT.start();
    }
    else {
	WVYT.player.loadVideoById(id);
    }
}


$(document).ready(function()
{
    WV.youtubeWidget = new WV.IframeWidget("video");
    WV.youtubeWidget.hide();
    WV.youtubeWidget.onHide = WVYT.stopVideo;
    //WV.youtubeWidget.setSrc("about:blank");
    WV.youtubeWidget.setSrc("/static/blank.html");
});
