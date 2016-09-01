
WV.Robots = {}

WV.Robots.addRobot = function(layer, rec)
{
    var t = WV.getClockTime();
    rec.clickHandler = WV.Robots.handleClick;
    //report("t: "+t);
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
    var id = WV.getUniqueId(name, rec.id);
    var imageUrl = WV.getIconUrl("BeamRobot.png");
    var scale = 0.2;
    if (layer.imageUrl)
	imageUrl = layer.imageUrl;
    if (rec.robotType == "double") {
	imageUrl = WV.getIconUrl("double-robotics-2.png");
	scale = 0.1;
    }
    if (rec.robotType == "beam") {
	imageUrl = WV.getIconUrl("BeamRobot.png");
	scale = 0.2;
    }
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
	//report("billboard exists "+id);
	WV.updateBillboard(b, lat, lon, h);
    }
}

WV.Robots.addTrail = function(layer, rec)
{
    report("WV.Robots.addTrail "+layer.name);
    var url = rec.dataUrl;
    rec.clickHandler = WV.Robots.handleClick;
    WV.getJSON(url, function(data) {
	    WV.Robots.handleTrailData(layer, rec, data);
    });
}

WV.Robots.handleTrailData = function(layer, rec, data)
{
    rec.layerName = layer.name;
    var recs = data.recs;
    var h = rec.height;
    rec.clickHandler = WV.Robots.handleClick;
    if (!h)
	h = 2;
    var coordSys = rec.coordSys;
    report("handleTrailData "+rec.dataUrl+" coordSys: "+coordSys);
    var points = [];
    var pathId = "robot_path_"+rec.id
    for (var i=0; i<recs.length; i++) {
	var tr = recs[i];
	var pos = tr.pos;
	var lla = WV.xyzToLla(tr.pos, coordSys);
	//report(" "+i+"  "+pos+"  "+lla);
	//var xyz = Cesium.Cartesian3.fromDegrees(lla[1], lla[0], h);
	//points.push(xyz);
	var alt = h;
	if (data.haveAltitude)
	    alt = lla[2];
	points.push(Cesium.Cartesian3.fromDegrees(lla[1], lla[0], alt));
    }
    var color = Cesium.Color.RED;
    if (rec.youtubeId)
	color = Cesium.Color.BLUE;
    var material = new Cesium.PolylineGlowMaterialProperty({
	    color : color,
	    glowPower : 0.15});
    var opts = { positions : points,
		 // id: pathId,
		 width : 3.0,
		 material : material };
    var route = null;
    var polylines = WV.getTetherPolylines();
    //route = polylines.add({polyline: opts});
    route = polylines.add({polyline: opts, id: pathId});
    route = route.polyline;
    var obj = {layerName: layer.name, id: pathId, data: data,
	       pathRec: rec, tourName: rec.tourName,
               points: points};
    WV.recs[pathId] = obj;
    layer.recs[pathId] = obj;
    return route;
}

WV.updateCursor = function(rec, xyz)
{
    rec.cursor_id = "cursor_"+rec.id
    var entities = WV.viewer.entities;
    var cursor = entities.getById(rec.cursor_id);
    if (cursor) {
	cursor.position = xyz;
    }
    else {
	var nearFar = new Cesium.NearFarScalar(10000, 2.0, 200000, 0.2)
	entities.add({
		position : xyz,
		id: rec.cursor_id,
		point : {
		    // pixelSize will multiply by the scale factor, so in this
		    // example the size will range from 20px (near) to 5px (far).
		    pixelSize : 10,
		    scaleByDistance : nearFar
		}
	    });
    }
}

WV.Robots.addDroneTrail = function(layer, rec)
{
    report("WV.Robots.addDroneTrail "+layer.name);
    rec.layerName = layer.name;
    var url = rec.dataUrl;
    rec.clickHandler = WV.Robots.handleClick;
    WV.getJSON(url, function(data) {
	    WV.Robots.handleDroneTrailData(layer, rec, data);
    });
}

/*
WV.Robots.handleDroneTrailData = function(layer, rec, data)
{
    var recs = data.recs;
    var coordSys = rec.coordSys;
    report("handleDroneTrailData "+rec.dataUrl+" coordSys: "+coordSys);
    var points = [];
    var pathId = "drone_path_"+rec.id
    for (var i=0; i<recs.length; i++) {
	var tr = recs[i];
	var pos = tr.pos;
	var lla = WV.xyzToLla(tr.pos, coordSys);
	//report(" "+i+"  "+pos+"  "+lla);
	//var xyz = Cesium.Cartesian3.fromDegrees(lla[1], lla[0], h);
	//points.push(xyz);
	points.push(Cesium.Cartesian3.fromDegrees(lla[1], lla[0], lla[2]));
    }
    var color = Cesium.Color.RED;
    if (rec.youtubeId)
	color = Cesium.Color.GREEN;
    var material = new Cesium.PolylineGlowMaterialProperty({
	    color : color,
	    glowPower : 0.15});
    var opts = { positions : points,
		 // id: pathId,
		 width : 5.0,
		 material : material };
    var route = null;
    var polylines = WV.getTetherPolylines();
    //route = polylines.add({polyline: opts});
    route = polylines.add({polyline: opts, id: pathId});
    route = route.polyline;
    var obj = {layerName: layer.name, id: pathId, data: data,
	       pathRec: rec, tourName: rec.tourName,
               points: points};
    WV.recs[pathId] = obj;
    layer.recs[pathId] = obj;
    return route;
}
*/
WV.Robots.handleDroneTrailData = function(layer, rec, data)
{
    rec.clickHandler = WV.Robots.handleClick;
    rec.layerName = layer.name;
    var recs = data.recs;
    var coordSys = rec.coordSys;
    report("handleDroneTrailData "+rec.dataUrl+" coordSys: "+coordSys);
    var deltaT = rec.youtubeDeltaT;
    data.startTime = 0;
    rec.videoDeltaT = rec.youtubeDeltaT;
    var videoDur = rec.videoDur;
    report("deltaT: "+deltaT);
    report("videoDur: "+videoDur);
    var points = [];
    var pathId = "drone_path_"+rec.id
    for (var i=0; i<recs.length; i++) {
	var tr = recs[i];
	tr.vt = null;
	var pos = tr.pos;
	var t = tr.time;
	var vt = t - deltaT;
	report("vt: "+vt);
	if (vt < 0 || vt > videoDur) {
	    report("rejecting i at: "+vt);
	    continue;
	}
	tr.vt = vt;
	var lla = WV.xyzToLla(tr.pos, coordSys);
	points.push(Cesium.Cartesian3.fromDegrees(lla[1], lla[0], lla[2]));
    }
    var color = Cesium.Color.RED;
    if (rec.youtubeId)
	color = Cesium.Color.GREEN;
    var material = new Cesium.PolylineGlowMaterialProperty({
	    color : color,
	    glowPower : 0.15});
    var opts = { positions : points,
		 // id: pathId,
		 width : 5.0,
		 material : material };
    var route = null;
    var polylines = WV.getTetherPolylines();
    //route = polylines.add({polyline: opts});
    route = polylines.add({polyline: opts, id: pathId});
    route = route.polyline;
    var obj = {layerName: layer.name, id: pathId, data: data,
	       pathRec: rec, tourName: rec.tourName,
               points: points};
    WV.recs[pathId] = obj;
    layer.recs[pathId] = obj;
    return route;
}

/*
WV.findPointByTime = function(rec, rt)
{
    for (var i=0; i<rec.data.recs.length; i++) {
        if (rec.data.recs[i].rt > rt)
	    break;
    }
    if (i >= rec.points.length)
	i = rec.points.length-1;
    return {i: i, nearestPt: rec.points[i]};
}
*/
WV.findPointByTime = function(rec, rt)
{
    var recs = rec.data.recs;
    var iMin = 0;
    var iMax = recs.length-1;

    while (iMin < iMax) {
	var i = Math.floor((iMin + iMax)/2.0);
	var rec = recs[i];
	if (rec.rt == rt)
	    break;
	if (rec.rt < rt) {
	    iMin = i+1;
	}
	else if (rec.rt > rt) {
	    iMax = i-1;
	}
    }
    if (i >= rec.points.length)
	i = rec.points.length-1;
    return {i: i, nearestPt: rec.points[i]};
}


WV.findNearestPoint = function(pt, points)
{
    report("findNearestPoint: pt: "+pt+" npoints: "+points.length);
    if (points.length == 0) {
	report("findNearestPoint called with no points");
	null;
    }
    var d2Min = Cesium.Cartesian3.distanceSquared(pt, points[0]);
    iMin = 0;
    for (var i=1; i<points.length; i++) {
	var d2 = Cesium.Cartesian3.distanceSquared(pt, points[i]);
	if (d2 < d2Min) {
	    d2Min = d2;
	    iMin = i;
	}
    }
    return {'i': iMin, nearestPt: points[iMin], 'd': Math.sqrt(d2Min)};
}

WV.Robots.noticeTimeChange = function(rec, status)
{
    //report(rec.layerName+" "+rec.id+" t: "+status.t);
    var rt = status.t;
    var res = WV.findPointByTime(rec, rt);
    report("noticeTimeChange res: "+JSON.stringify(res));
    WV.updateCursor(rec, res.nearestPt);
}

WV.Robots.handleClick = function(rec, xy, xyz)
{
    report("WV.Robots.handleClick rec: "+rec);
    report("WV.Robots xy: "+xy+"  "+xyz);
    RECX = rec;
    if (rec.url) {
	WV.showPage(rec);
	return;
    }
    var res = WV.findNearestPoint(xyz, rec.points);
    report("res: "+JSON.stringify(res));
    RES_ = res;
    var frameRate = 29.97;
    var idx = 0;
    var dt = 0;
    var t = 0;
    var vt = null;
    if (res) {
	var data = rec.data;
	var startTime = data.startTime;
	t = data.recs[res.i].time;
	vt = data.recs[res.i].vt;
	dt = t - startTime;
	idx = Math.floor(dt * frameRate);
	report("t: "+t+"   dt: "+dt+"   idx: "+idx+"   d: "+res.d);
	WV.updateCursor(rec, res.nearestPt);
	WVYT.watcher = function (st) { WV.Robots.noticeTimeChange(rec, st)};
    }
    else {
	report("Cannot find estimate of t:");
	idx = Math.floor(10*WV.getClockTime()) % 2000;
	dt = Math.floor(10*WV.getClockTime()) % 100;
    }
    if (rec.pathRec && rec.pathRec.youtubeId) {
	// We have a youtube video and a time to seek to
	var t = dt;
	if (vt != null) {
	    report("**** vt: "+vt);
	    t = vt;
	}
	else if (rec.pathRec.videoDeltaT) {
	    report("**** videoDeltaT: "+rec.pathRec.videoDeltaT);
	    t -= rec.pathRec.videoDeltaT;
	    report("t: "+t);
	}
	else if (rec.pathRec.youtubeDeltaT) {
	    report("**** youtubeDeltaT: "+rec.pathRec.youtubeDeltaT);
	    t += rec.pathRec.youtubeDeltaT;
        }
	var playOpts = {'youtubeId': rec.pathRec.youtubeId, 't': t}
	report("playing prec: "+JSON.stringify(playOpts));
	WV.playVid(playOpts);
	return;
    }
    // We have a set of still image panaramas and and index
    var url = "http://tours.paldeploy.com:8001/pannellum/viewPano.html";
    url += "?imageId="+rec.tourName+"/"+idx;
    WV.showPage({url: url});
}

WV.Robots.moveHandler = function(rec, xy, xyz)
{
    report("WV.Robots.handleMove rec: "+rec);
    report("WV.Robots xy: "+xy+"  "+xyz);
    if (rec.coordSys) {
	//var cs = WV.coordinateSystems[rec.coordSys];
	report("CS "+rec.coordSys);
	var cart = Cesium.Cartographic.fromCartesian(xyz);
	report("cart: "+JSON.stringify(cart));
	var lat = WV.toDegrees(cart.latitude);
	var lon = WV.toDegrees(cart.longitude);
	var lla = [lat, lon, cart.height];
	report("latLonAlt: "+lla);
	var lxyz = WV.geoPosToXyz(lla, rec.coordSys);
	report("lxyz: "+lxyz);
    }
    RECX = rec;
}

WV.registerModule("WVRobots.js");

WV.registerRecHandler("robotTrail", WV.Robots.addTrail);
WV.registerRecHandler("dronePath", WV.Robots.addDroneTrail);
WV.registerRecHandler("robot", WV.Robots.addRobot);
WV.registerRecHandler("model", WV.addModel);

WV.registerRecHandler("CoordinateSystem",
    function(layer, rec) {
        var csName = rec.coordSys;
	report("**** adding CoordinateSystem "+csName);
	WV.addCoordinateSystem(csName, rec);
    });

WV.registerLayerType("robots", {
	dataHandler: WV.handleRecs,
        clickHandler: WV.Robots.handleClick,
	moveHandler: WV.Robots.moveHandler
});



