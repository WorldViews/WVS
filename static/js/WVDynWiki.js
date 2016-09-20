
WV.DynWiki = {}
WV.DynWiki.uiHtml = "\
<form class='dynWiki'>\
<!--   Topic: <input id='dynWikiTopic' type=text size=12> -->\
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
	rec.url = rec.url.replaceAll(' ', '_');
        rec.id = ""+rec.pageid;
	report("rec: "+WV.toJSON(rec));
	precs.push(rec);
    }
    WV.handleRecs({'records': precs}, 'dynWiki');
}

WV.DynWiki.initLayer = function(layer)
{
    report("********************");
    report("DynWiki.initLayer");
    report("layer: "+layer);
    report("layer: "+WV.toJSON(layer));
    layer.iconUrl = WV.getIconUrl("W.png");
    layer.scale = 0.1;
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
		WV.DynWiki.wikiSearch(query, lat, lon, range);
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


WV.DynWiki.handleClick = function(rec)
{
    report("WV.DynWiki.handleClick rec: "+WV.toJSON(rec));
    WV.playVid(rec);
}

WV.registerLayerType("dynWiki", {
      clickHandler: WV.DynWiki.handleClick,
      initFun: WV.DynWiki.initLayer,
      defaultRecType: "html"
});


