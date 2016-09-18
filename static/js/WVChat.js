

WV.Chat = {}

WV.Chat.initialized = false;
WV.Chat.watching = false;
WV.Chat.showTimeStamps = true;


WV.Chat.handleData = function(data, name)
{
    report("handleChatData "+name);
    report("data: "+WV.toJSON(data));
    var layer = WV.layers["chat"];
    //if (!layer.visible) {
    //	return;
    //}
    var t = WV.getClockTime();
    var recs = WV.getRecords(data);
    if (!recs) {
	report("No records in chat data");
	return;
    }
    recs.sort(function(a,b) { return a.t-b.t; })
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (rec.t == null) {
	    report("Bad rec with no time "+JSON.stringify(rec));
	    continue;
	}
	//report("chat rec: "+JSON.stringify(rec));
	var dt = t - rec.t;
	var str = rec.name+": "+rec.text;
	if (WV.Chat.showTimeStamps)
	    str = WV.toTimeStr(rec.t) + " " + str
	WV.Chat.widget.prepend(str+"<br>");
    }
}

WV.Chat.hide = function()
{
    WV.Chat.setVisibility(false);
}

WV.Chat.setVisibility = function(v)
{
    var layer = WV.layers["chat"];
    if (v) {
	report("Show #chatWindow ");
	$("#cb_chat").prop("checked", true);
	//$("#chatWindow").show(200);
	WV.Chat.widget.show();
	if (!WV.Chat.watching)
	    WV.Chat.postMessage("[joining chat]");
	WV.Chat.watching = true;
	if (!layer.visible)
	layer.visible = true;
	//$("#chatText").append("<br>");
	/*
	setTimeout(function() {
		report("ughhh......");
		$("#chatText").append("<br>");
	    }, 1000);
	*/
    }
    else {
	report("hide #chatWindow ");
	$("#cb_chat").prop("checked", false);
	layer.visible = false;
	//$("#chatWindow").hide(200);
	WV.Chat.widget.hide();
	if (WV.Chat.watching)
	    WV.Chat.postMessage("[leaving chat]");
	WV.Chat.watching = false;
    }
    //
}

//WV.WVCom.prototype.postMessage = function(text)
WV.Chat.postMessage = function(text)
{
    var msg = WV.getStatusObj();
    msg.text = text;
    msg.type = "chat";
    msg.id = WV.getUniqueId('chat');
    wvCom.sendMsg('chat', msg);
}

WV.xxxx = 0;
WV.chatter = function()
{
    WV.xxxx++;
    WV.Chat.postMessage("hello.  I am sam "+WV.xxxx);
    setTimeout(WV.chatter, 5000);
}


$(document).ready(function()
{
    WV.Chat.widget = new WV.WindowWidget("chat");
    WV.Chat.widget.dismiss = WV.Chat.hide;
    WV.Chat.widget.handleInput = WV.Chat.postMessage;

    WV.registerLayerType("chat", {
         dataHandler: WV.Chat.handleData,
         setVisibility: WV.Chat.setVisibility,
	     });

});

