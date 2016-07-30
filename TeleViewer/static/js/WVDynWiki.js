
WV.DynWiki = {}
WV.DynWiki.uiHtml = "\
<form class='dynWiki'>\
   Topic: <input id='dynWikiTopic' type=text size=12>\
   <button class='abc'>Go</button>\
</form>\
";
WV.DynWiki.initializedUI = false;

WV.DynWiki.wikiSearch = function(sterm, lat, lon, range)
{
    report("search: "+sterm);
    report("lat: "+lat);
    report("lon: "+lon);
    var url = "https://en.wikipedia.org/w/api.php?";
    url += "action=query&list=geosearch&gsradius=10000&";
    url += "gscoord="+lat+"|"+lon+"&";
    //url += "format=jsonp&callback=WV.DynWiki.wikiSearchCallback";
    //url += "callback=WV.DynWiki.wikiSearchCallback";
    report("url:" + url);
    $.ajax({ url: url,
             data: {
		format: 'json'
	     },
             dataType: "jsonp"}).done(function(obj){
		     //report("obj: "+WV.toJSON(obj));
		     WV.DynWiki.wikiSearchCallback(obj);
		 }
    );
    //, function(obj) {
    //});
}

WV.DynWiki.wikiSearchCallback = function(obj)
{
    report("wikiSearchCallback obj:" + obj);
    var precs = [];
    var recs = obj.query.geosearch;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.url = "https://en.wikipedia.org/wiki/" + rec.title;
	rec.url = rec.url.replace(' ', '_');
	rec.url = rec.url.replace(' ', '_');
	rec.url = rec.url.replace(' ', '_');
        rec.id = ""+rec.pageid;
	report("rec: "+WV.toJSON(rec));
	precs.push(rec);
    }
    WV.DynWiki.handleRecs({'records': precs}, 'dynWiki');
}

WV.DynWiki.initLayer = function(layer)
{
    report("********************");
    report("DynWiki.initLayer");
    report("layer: "+layer);
    report("layer: "+WV.toJSON(layer));
    layer.showFun = function(layer) {
	var jqid = "#"+layer.uiDivId;
	report("jqid: "+jqid);
	if (!WV.DynWiki.initializedUI) {
	    $(jqid).html(WV.DynWiki.uiHtml);
	    WV.DynWiki.initializedUI = true;
	}
	$(".dynWiki").submit(function(event) {
		var query = $("#dynWikiTopic").val();
		report("***** Got it!!!! topic: "+query);
		var range = "1000km";
		var lat = WV.curPos[0];
		var lon = WV.curPos[1];
		WV.DynWiki.wikiSearch(query, lat, lon, range,
			   WV.DynWiki.wikiResultsHandler,
			   WV.DynWiki.wikiErrorHandler);
		event.preventDefault();
		$("#dynWikiTopic").val(query);
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

WV.DynWiki.wikiErrorHandler = function(err)
{
    report("err: "+err);
}

WV.DynWiki.wikiResultsHandler = function(results)
{
    report("results:\n"+WV.toJSON(results));
    var obj = {'records': results};
    WV.DynWiki.handleRecs(obj, "dynWiki");
}

WV.DynWiki.handleRecs = function(data, layerName)
{
    report("WV.DynWiki.handleRecs");
    var layer = WV.layers["dynWiki"];
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
	report("dynWiki rec: "+WV.toJSON(rec));
	rec.layerName = layerName;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        //var imageUrl = layer.iconUrl;
        var imageUrl = WV.getIconUrl("videoLogo.png");
	if (0) {
	    var imgStr = '<img src="'+rec.thumbNailURL+'">';
	    report("imgStr: "+imgStr);
	    $("#layersDiv").append(imgStr+"\n");
	}
	var scale = 0.1;
        var lon = rec.lon;
        var lat = rec.lat;
	var h = 1000;
        id = layerName+"_"+rec.id;
	if (layer.recs[id]) {
	    report("already have id: "+id);
	}
	else {
	    layer.recs[id] = rec;
	    WV.recs[id] = rec;
	    var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl, id,
				    scale, h, layer.showTethers);
	    layer.billboards[id] = b;
	}
    }
}


WV.DynWiki.handleClick = function(rec)
{
    report("WV.DynWiki.handleClick rec: "+WV.toJSON(rec));
    WV.playVid(rec);
}

WV.registerLayerType("dynWiki", {
      dataHandler: WV.DynWiki.handleRecs,
      clickHandler: WV.DynWiki.handleClick,
      initFun: WV.DynWiki.initLayer
});


