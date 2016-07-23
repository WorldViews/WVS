
WV.Spirals = {}

WV.Spirals.animFun = function(layer)
{
    //report("WV.Spirals.tick");
    var t = WV.getClockTime();
    layer.models.forEach(function(model) {
        var rec = model._wvRec;
	var lat0 = rec.lat;
	var lon0 = rec.lon;
	var lat = lat0 + 10*Math.cos(0.05*t);
	var lon = lon0 + 10*Math.sin(0.05*t);
	var h = rec.height;
	var position = Cesium.Cartesian3.fromDegrees(lon, lat, h);
	report("rec: "+JSON.stringify(rec));
	report("lat: "+lat+"  lon: "+lon);
	//var position = model.position.getValue();
	var heading = Cesium.Math.toRadians(18*t);
	var pitch =  0;
	var roll = 0;
	var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading, pitch, roll);
	model.position.setValue(position);
	model.orientation.setValue(orientation);
    });
    setTimeout(function() {
	    WV.Spirals.animFun(layer);
	}, 1000/30);
}

WV.Spirals.initLayer = function(layer)
{
    report("********************");
    report("Spirals.initLayer");
    report("layer: "+layer);
    report("layer: "+WV.toJSON(layer));
    layer.recs = {};
    layer.tethers = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    layer.showFun = function(layer) {
	report("showFun");
    }
    layer.hideFun = function(layer) {
	report("hideFun");
    }
    setTimeout(function() {
	    WV.Spirals.animFun(layer);
	}, 1000);
}

WV.Spirals.handleRecs = function(data, name)
{
    report("WV.Spirals.handleRecs "+name);
    //var layer = WV.layers["robots"];
    var layer = WV.layers[name];
    if (!layer.visible) {
	return;
    }
    var imageUrl = layer.imageUrl;
    var recs = WV.getRecords(data);
    var t = WV.getClockTime();
    //report("t: "+t);
    //var polylines = WV.getTetherPolylines();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (rec.type == "CoordinateSystem") {
	    var csName = rec.coordSys;
	    report("**** adding CoordinateSystem "+csName);
	    WV.addCoordinateSystem(csName, rec);
	    continue;
	}
	if (rec.type == "model") {
	    WV.addModel(layer, rec);
	    continue;
	}
        layer.numObjs++;
	var dt = t - rec.t;
	var lat, lon;
	if (rec.position) {
	    var csName = rec.coordSys;
	    var lla = WV.xyzToLla(rec.position, csName);
	    lat = lla[0];
	    lon = lla[1];
	}
	else {
	    lat = rec.lat;
	    lon = rec.lon;
	}
	var h = 50000;
        var id = "robot_"+rec.id;
	var imageUrl = "images/BeamRobot.png";
	var scale = 0.2;
	if (layer.imageUrl)
	    imageUrl = layer.imageUrl;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var curPosScale = 0.1;
	var b = layer.billboards[id];
	//report("robot id: "+id+" "+lat+" "+lon);
	if (b == null) {
	    b = WV.addBillboard(layer.bbCollection, lat, lon,
				imageUrl, id, scale, h, true, true);
	    layer.billboards[id] = b;
	}
	else {
	    WV.updateBillboard(b, lat, lon, h);
	}
    }
}

WV.Spirals.handleClick = function(rec, xy, xyz)
{
    report("WV.Spirals.handleClick rec: "+rec);
    report("WV.Spirals xy: "+xy+"  "+xyz);
    if (rec.url) {
	WV.showPage(rec);
	return;
    }
    WV.showPage({url: url});
}

WV.registerLayerType("spirals", {
	dataHandler: WV.Spirals.handleRecs,
        clickHandler: WV.Spirals.handleClick,
	initFun: WV.Spirals.initLayer
});

