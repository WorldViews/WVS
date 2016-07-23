

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
    var obj = {'records': results};
    WV.DynYouTube.handleRecs(obj, "dynYouTube");
}

WV.DynYouTube.handleRecs = function(data, layerName)
{
    report("WV.DynYouTube.handleRecs");
    var layer = WV.layers["dynYouTube"];
    if (!layer.visible) {
	return;
    }
    //    WV.setPeopleBillboardsVisibility(true);
    if (layer.recs == null) {
	report("initing RobotData layer");
	layer.recs = {};
	layer.tethers = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    layer.setVisibility(true);
    var recs = data.records;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("dynYouTube rec: "+WV.toJSON(rec));
	rec.layerName = layerName;
	rec.youtubeId = rec.videoId;
	if (!rec.youtubeId) {
            report("skipping recs with no youtube video");
            continue;
        }
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        //var imageUrl = layer.iconUrl;
        var imageUrl = "images/videoLogo.png";
	if (0) {
	    var imgStr = '<img src="'+rec.thumbNailURL+'">';
	    report("imgStr: "+imgStr);
	    $("#layersDiv").append(imgStr+"\n");
	}
	var scale = 0.1;
        var lon = rec.lon;
        var lat = rec.lat;
        id = layerName+"_"+rec.videoId;
	if (layer.recs[id]) {
	    report("already have id: "+id);
	}
	else {
	    layer.recs[id] = rec;
	    WV.recs[id] = rec;
	    var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl, id,
				    scale, layer.height, layer.showTethers);
	    layer.billboards[id] = b;
	}
    }
}


WV.DynYouTube.handleClick = function(rec)
{
    report("WV.DynYouTube.handleClick rec: "+WV.toJSON(rec));
    WV.playVid(rec);
}

WV.registerLayerType("dynYouTube", {
      dataHandler: WV.DynYouTube.handleRecs,
      clickHandler: WV.DynYouTube.handleClick,
      initFun: WV.DynYouTube.initLayer
});


