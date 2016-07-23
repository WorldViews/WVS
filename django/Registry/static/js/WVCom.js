/*
  This module encapsulates the methods for getting geo data to show
  for various layers.   To use it, create a WVCom object, and then
  subscribe to various event types, and register a handler for each
  type.

 */

//WV.useSocketIO = false;
WV.socket = null;

WV.WVCom = function()
{
    report(">>> WV.useSocketIO: "+WV.useSocketIO);
    this.types = {};
    if (WV.useSocketIO) {
	report("Getting socket.io socket");
	WV.socket = io();
	WV.socket.on('register', function(msg){
	    });
	WV.socket.on('sharecam', WV.sharecamHandler);
        //socket.emit('register', "hello");
    }
    else {
	report("*** not using socket.io ***");
    }
}

WV.sharecamHandler = function(msg)
{
    //report("sharecam: "+msg);
}

WV.Watcher = function(wvCom, evType)
{
    this.wvCom = wvCom;
    this.evType = evType;
    this.prevMaxId = null;
    report(">>> Starting poll requests evType: "+evType);
    if (WV.socket) {
	report("watching socket.io stream for "+evType);
	var inst = this;
	WV.socket.on(evType, function(dataStr) {
		var data = JSON.parse(dataStr)
		inst.sioHandler(data);
	    });
    }
    else {
	this.pollRequest();
    }
}

WV.Watcher.prototype.sioHandler = function(data)
{
    var typeObj = this.wvCom.types[this.evType];
    if (typeObj.handler) {
	try {
	    var recs = [data];
	    //report("sioHandler: recs "+JSON.stringify(recs));
	    typeObj.handler(recs, this.evType);
	}
	catch (err) {
	    report(""+err);
	}
    }
}

WV.Watcher.prototype.pollRequest = function()
{
    report("WV.Wacher.pollRequest "+this.evType);
    //var url = "/imageTweets/?maxNum=10";
    var url = "/wvgetdata/?type="+this.evType;
    url += "&maxNum=10";
    if (this.prevMaxId)
	url += "&prevEndNum="+this.prevMaxId;
    report(" url: "+url);
    var inst = this;
    WV.getJSON(url, function(data) {
	    inst.pollHandler(data);
	});
}

WV.Watcher.prototype.pollHandler = function(data)
{
    report("WV.Watcher.pollHandler got data evType: "+this.evType);
    var inst = this;
    //var recs = data.images.slice(0,100);
    //report("data: "+JSON.stringify(data));
    var recs = data.recs;
    if (recs.length > 100)
	recs = recs.slice(0,100);
    for (var i=0; i<recs.length; i++) {
	var rec = recs[i];
	if (rec.id)
	    this.prevMaxId = rec.id;
    }
    var typeObj = this.wvCom.types[this.evType];
    if (typeObj.handler) {
	try {
	    typeObj.handler(recs, this.evType);
	}
	catch (err) {
	    report(""+err);
	}
    }
    setTimeout(function() { inst.pollRequest()}, 1000);
}


WV.WVCom.prototype.subscribe = function(evType, handler, opts)
{
    report(">>>> WVCom.subscribe "+evType+" "+opts);
    xxopts = opts;
    report("WVCom.subscribe "+evType+" "+JSON.stringify(opts));
    if (opts == null)
	opts = {};
    var typeObj = {'eventType': evType}
    typeObj.handler = handler;
    this.types[evType] = typeObj;
    if (opts.dataFile) {
	var url = opts.dataFile;
        WV.getJSON(url, function(data) {
		handler(data, evType)});
    }
    else {
	typeObj.watcher = new WV.Watcher(this, evType);
    }
    if (!typeObj.watcher) {
	if (evType == "robots" || evType == "periscope") {
	    typeObj.watcher = new WV.Watcher(this, evType);
	}
    }
    if (evType == "notes" || evType == "chat" || evType == "periscope") {
	var url = "/db/"+evType;
	if (evType == "periscope") {
	    tMin = WV.getClockTime()-60*60;
	    //url = url + "?tMin="+tMin+"&limit=50";
	    url = url + "?limit=50";
	}
	report("WVCom.subscribe "+evType+" fetching "+url);
	WV.getJSON(url, function(data) {
		handler(data, evType);
	    });
    }
}

WV.WVCom.prototype.sendStatus = function(status)
{
    var sStr = JSON.stringify(status);
    //report("sStr: "+sStr);
    if (WV.socket) {
	try {
	    WV.socket.emit('people', sStr);
	}
	catch (err) {
	    report(""+err);
	}
    }
    else {
	jQuery.post("/register/", sStr, function() {
		report("registered");
	    }, "json");
    }
}

WV.WVCom.prototype.sendNote = function(note)
{
    this.sendMsg("notes", note);
}

WV.WVCom.prototype.sendMsg = function(mtype, msg)
{
    var str = JSON.stringify(msg);
    //report("sStr: "+sStr);
    if (WV.socket) {
	try {
	    WV.socket.emit(mtype, str);
	}
	catch (err) {
	    report(""+err);
	}
    }
    else {
	jQuery.post("/msg/"+mtype+"/", str, function() {
		report("sent mtype");
	    }, "json");
    }
}
