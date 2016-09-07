/*
This code was inspired by and based on
geo-search-tool by Steve Nicholls, which
is distributed under Apache License 2.0.
*/

WV.DynYouTube = {}
WV.DynYouTube.uiHtml = "\
<form class='dynYouTube'>\
   Topic: <input id='dynYouTubeTopic' type=text size=12>\
   <button class='abc'>Go</button>\
</form>\
";
WV.DynYouTube.initializedUI = false;

WV.DynYouTube.initLayer = function(layer)
{
    report("********************");
    report("DynYouTube.initLayer");
    report("layer: "+layer);
    report("layer: "+WV.toJSON(layer));
    layer.iconUrl = WV.getIconUrl("videoLogo.png");
    layer.scale = 0.1;
    layer.showFun = function(layer) {
	var jqid = "#"+layer.uiDivId;
	report("jqid: "+jqid);
	if (!WV.DynYouTube.initializedUI) {
	    $(jqid).html(WV.DynYouTube.uiHtml);
	    WV.DynYouTube.initializedUI = true;
	}
	$(".dynYouTube").submit(function(event) {
		var query = $("#dynYouTubeTopic").val();
		report("***** Got it!!!! topic: "+query);
		var range = "1000km";
		var lat = WV.curPos[0];
		var lon = WV.curPos[1];
		YTS.youtubeSearch(query, lat, lon, range,
				  WV.DynYouTube.ytsResultsHandler,
				  WV.DynYouTube.ytsErrorHandler);
		event.preventDefault();
		$("#dynYouTubeTopic").val(query);
		return true;
	    });
	$(jqid).show();
    }
    layer.hideFun = function(layer) {
	var jqid = "#"+layer.uiDivId;
	report("jqid: "+jqid);
	$(jqid).hide();
    }
}

WV.DynYouTube.ytsErrorHandler = function(err)
{
    report("err: "+err);
}

WV.DynYouTube.ytsResultsHandler = function(results)
{
    report("results:\n"+WV.toJSON(results));
    for (var i=0; i<results.length; i++) {
	var rec = results[i];
	rec.youtubeId = rec.videoId;
	rec.recType = "video";
	rec.id = rec.videoId;
    }
    var obj = {'records': results};
    WV.handleRecs(obj, "dynYouTube");
}

WV.DynYouTube.handleClick = function(rec)
{
    report("WV.DynYouTube.handleClick rec: "+WV.toJSON(rec));
    WV.playVid(rec);
}

WV.registerLayerType("dynYouTube", {
      clickHandler: WV.DynYouTube.handleClick,
      initFun: WV.DynYouTube.initLayer
});


