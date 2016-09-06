
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
WVYT.requestedStartTime = null;

WVYT.trackerRunning = false;
WVYT.watcher = null;

WVYT.runTracker = function()
{
    if (WVYT.trackerRunning)
	return;
    WVYT.trackerRunning = true;
    WVYT.trackerTick();
}

WVYT.trackerTick = function()
{
    if (WVYT.player == null)
	WVYT.trackerRunning = false;
    if (!WVYT.trackerRunning)
	return;
    var playing = WVYT.player.getPlayerState() == 1;
    var t = WVYT.player.getCurrentTime();
    var status = {t: t, playing: playing}
    //report("stat: "+JSON.stringify(status));
    if (WVYT.watcher) {
	try {
	    WVYT.watcher(status);
	}
	catch (e) {
	    report("err: "+e);
	}
    }
    setTimeout(WVYT.trackerTick, 250);
}

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
    if (WVYT.requestedStartTime) {
	event.target.seekTo(WVYT.requestedStartTime);
	WVYT.requestedStartTime = null;
    }
    event.target.playVideo();
    WVYT.runTracker();
}

      // 5. The API calls this function when the player's state changes.
      //    The function indicates that when playing a video (state=1),
      //    the player should play for six seconds and then stop.
WVYT.done = false;

WVYT.onPlayerStateChange = function(event) {
    report("-------> onPlayerStateChange "+event.data);
    if (event.data == YT.PlayerState.PLAYING && !WVYT.done) {
	report("-------> onPlayerStateChange "+event.data);
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
	if (rec.t)
	    WVYT.requestedStartTime = rec.t;
	WVYT.start();
    }
    else {
	var opts = {'videoId': id};
	if (rec.t)
	    opts.startSeconds = rec.t;
	WVYT.player.loadVideoById(opts);
    }
    // Notify WV Server in case there is a slaved
    // browswer (e.g. with HMD) wanting to play the
    // same videos
    WVYT.notifyServer(id, rec);
}

WVYT.notifyServer = function(id, rec)
{
    report("Notify server\n");
    var obj = {'youtubeId': id,
		'action': 'watchVideo'};
    var data = JSON.stringify(obj);
    //data = "good morning vietnam";
    report("sending data "+data);
    $.get("/notify/",
           obj,
	   function() { report("Server notified");},
	   "json");
}

$(document).ready(function()
{
    WV.youtubeWidget = new WV.IframeWidget("video");
    WV.youtubeWidget.hide();
    WV.youtubeWidget.onHide = WVYT.stopVideo;
    //WV.youtubeWidget.setSrc("about:blank");
    WV.youtubeWidget.setSrc("/static/blank.html");
});
