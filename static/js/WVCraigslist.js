

WV.Craigslist = {}

WV.Craigslist.handleRecs = function(data, name)
{
    report("WV.Craigslist.handleRecs");
    var layer = WV.layers["craigslist"];
    if (!layer.visible) {
	return;
    }
    //    WV.setPeopleBillboardsVisibility(true);
    if (layer.recs == null) {
	report("initing Craigslist Data layer");
	layer.recs = {};
	layer.tethers = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    layer.setVisibility(true);
    //WV.Craigslist.setVisibility(true);
    var imageUrl = layer.imageUrl;
    var recs = WV.getRecords(data);
    var t = WV.getClockTime();
    //var polylines = WV.getTetherPolylines();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.layerName = "craigslist";
        report("rec "+i+" "+JSON.stringify(rec));
        layer.numObjs++;
	var dt = t - rec.t;
	var lat, lon;
	var geotag = rec.geotag;
	if (!geotag) {
	    report("**** bad CL record with no geotag");
	    continue;
	}
	lat = geotag[0];
	lon = geotag[1];
	var h = 5000;
        var id = "craigslist_"+rec.id;
	var imageUrl = "/static/img/billboards/BeamRobot.png";
	var scale = 0.2;
	if (layer.imageUrl)
	    imageUrl = layer.imageUrl;
	if (rec.recType == "housing") {
	    imageUrl = "/static/img/billboards/houseIcon.png";
	    scale = 0.1;
	}
	if (rec.recType == "event") {
	    imageUrl = "/static/img/billboards/eventIcon.png";
	    scale = 0.04;
	}
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var curPosScale = 0.1;
	var b = layer.billboards[id];
	if (b == null) {
	    b = WV.addBillboard(layer.bbCollection, lat, lon,
				 imageUrl, id, scale, h, false);
	    layer.billboards[id] = b;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h);
	    layer.billboards[id].position = pos;
	    layer.billboards[id].show = true;
	}
    }
}


WV.Craigslist.handleClick = function(rec)
{
    report("WV.Craigslist.handleClick rec: "+WV.toJSON(rec));
    //WV.showPage(rec);
    window.open(rec.url, "HTMLPages");
}

WV.registerModule("WVCraigslist.js");

$(document).ready(function() {
    WV.registerLayerType("craigslist", {
         dataHandler: WV.Craigslist.handleRecs,
         clickHandler: WV.Craigslist.handleClick
	     });
});


