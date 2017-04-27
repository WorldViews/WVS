/*
  This is code for playing a youtube video in an Iframe.
  https://developers.google.com/youtube/iframe_api_reference#Requirements


*** Note: this was created as a copy of WVYT which is almost generic enough
for both Cesium and Leaflet.  After this is working with Leaflet, WVYT.js
may be refactored to handle both cases.
***
 */

if (typeof report === 'undefined')
   report = function(str) { console.log(str); }
//function report(str) { console.log(str); }

WVYT = {}
WVYT.height = 500;
WVYT.width = 650;
WVYT.videoId = null;
WVYT.iframeId = "viewer-iframe";
WVYT.divId = "player_div";
WVYT.player = null;
WVYT.requestedStartTime = null;

WVYT.trackerRunning = false;
WVYT.watchers = [];

WVYT.play = function(videoId, t)
{
}


WVYT.setPlayTime = function(t)
{
    report("WVYT.setPlayTime "+t);
    if (!WVYT.player) {
	report("no player");
	return;
    }
    WVYT.player.seekTo(t);
}

WVYT.registerWatcher = function(watcher)
{
    WVYT.watchers.push(watcher);
}

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
    WVYT.watchers.forEach(function (watcher) {
	try {
	    watcher(status);
	}
	catch (e) {
	    report("err: "+e);
	    report("stack: "+e.stack);
	}
    });
    setTimeout(WVYT.trackerTick, 250);
}

WVYT.start = function()
{
    report("WVYT.start");
    if (WVYT.apiReady) {
        onYouTubeIframeAPIReady();
    } else {
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
    report("onYouTubeIframeAPIReady");
    WVYT.apiReady = true;
    WVYT.ready = false;
    if (WVYT.videoId == null) {
	error("No videoId");
	return;
    }
    //report("setupYouTubePlayer "+WVYT.videoId+" "+WVYT.divId);
    WVYT.player = new YT.Player(WVYT.divId, {
	width: WVYT.width, height: WVYT.height,
	    videoId: WVYT.videoId,
	    events: {
                'onReady': WVYT.onPlayerReady,
                'onStateChange': WVYT.onPlayerStateChange
	    }
    });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// 4. The API will call this function when the video player is ready.
WVYT.onPlayerReady = function(event) {
    WVYT.ready = true;
    if (WVYT.requestedStartTime) {
	event.target.seekTo(WVYT.requestedStartTime);
	WVYT.requestedStartTime = null;
    }
    event.target.playVideo();
    WVYT.runTracker();
}

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
    if (!WVYT.ready) {
        WVYT.requestedStartTime = rec.t;
        return;
    }

    report("==============================================");
    report("WVYT.playVideo "+id+" "+JSON.stringify(rec));
    report("WVYT.videoId (current) "+WVYT.videoId);
    //WV.youtubeWidget.show();
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

if (typeof module !== 'undefined') {
    module.exports = exports = WVYT;
}