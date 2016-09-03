
WV.Trails = {}

WV.Trails.addRobot = function(layer, rec)
{
    var t = WV.getClockTime();
    rec.clickHandler = WV.Trails.handleClick;
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

WV.Trails.addTrail = function(layer, rec)
{
    report("WV.Trails.addTrail "+layer.name);
    var url = rec.dataUrl;
    rec.clickHandler = WV.Trails.handleClick;
    WV.getJSON(url, function(data) {
	    WV.Trails.handleTrailData(layer, rec, data);
    });
}

WV.Trails.handleTrailData = function(layer, rec, data)
{
    rec.layerName = layer.name;
    var recs = data.recs;
    var h = rec.height;
    rec.clickHandler = WV.Trails.handleClick;
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

WV.Trails.addDroneTrail = function(layer, rec)
{
    report("WV.Trails.addDroneTrail "+layer.name);
    rec.layerName = layer.name;
    var url = rec.dataUrl;
    rec.clickHandler = WV.Trails.handleClick;
    WV.getJSON(url, function(data) {
	    WV.Trails.handleDroneTrailData(layer, rec, data);
    });
}

/*
WV.Trails.handleDroneTrailData = function(layer, rec, data)
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
WV.Trails.handleDroneTrailData = function(layer, rec, data)
{
    rec.clickHandler = WV.Trails.handleClick;
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
	//report("vt: "+vt);
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

WV.findPointByTime = function(rec, rt)
{
    for (var i=0; i<rec.data.recs.length; i++) {
        if (rec.data.recs[i].rt > rt)
	    break;
    }
    if (i >= rec.points.length)
	i = rec.points.length-1;
    if (i == 0)
	return {i: i, f: 0, nearestPt: rec.points[i]};
    var i0 = i-1;
    var rt0 = rec.data.recs[i0].rt;
    var rt01 = rec.data.recs[i].rt - rt0;
    var f = (rt - rt0) / rt01;
    //report("i0: "+i0+" i: "+i+"  f: "+f);
    var p0 = rec.points[i0];
    var p1 = rec.points[i];
    var pt = new Cesium.Cartesian3();
    Cesium.Cartesian3.lerp(rec.points[i0], rec.points[i], f, pt);
    return {i: i, f: f, nearestPt: pt};
}
/*
WV.findPointByTime = function(rec, rt)
{
    var recs = rec.data.recs;
    var iMin = 0;
    var iMax = recs.length-1;

    while (iMin < iMax) {
	var i = Math.floor((iMin + iMax)/2.0);
	var trec = recs[i];
	if (trec.rt == rt)
	    break;
	if (trec.rt < rt) {
	    iMin = i+1;
	}
	else if (trec.rt > rt) {
	    iMax = i-1;
	}
    }
    if (i >= rec.points.length)
	i = rec.points.length-1;
    return {i: i, nearestPt: rec.points[i]};
}
*/


WV.findNearestPoint = function(pt, points)
{
    //report("findNearestPoint: pt: "+pt+" npoints: "+points.length);
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

WV.Trails.PREV_RT = null;

WV.Trails.noticeTimeChange = function(rec, status)
{
    var rt = status.t;
    if (WV.Trails.PREV_RT == rt)
	return;
    WV.Trails.PREV_RT = rt;
    report("noticeTimeChange "+rec.layerName+" "+rec.id+" rt: "+rt);
    var tt = rt - rec.pathRec.youtubeDeltaT;
    var res = WV.findPointByTime(rec, tt);
    //report("noticeTimeChange res: "+JSON.stringify(res));
    WV.updateCursor(rec, res.nearestPt);
}

WV.Trails.handleClick = function(rec, xy, xyz, e)
{
    report("WV.Trails.handleClick rec: "+rec);
    report("WV.Trails xy: "+xy+"  "+xyz);
    RECX = rec;
    EE = e;
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
	WVYT.watcher = function (st) { WV.Trails.noticeTimeChange(rec, st)};
    }
    else {
	report("Cannot find estimate of t:");
	idx = Math.floor(10*WV.getClockTime()) % 2000;
	dt = Math.floor(10*WV.getClockTime()) % 100;
    }
    if (rec.pathRec && rec.pathRec.youtubeId) {
	// We have a youtube video and a time to seek to
	// at this point, we will assume t is trail time...
	// we want to compute video time vt
	var t = dt;
	if (vt != null) {
	    report("**** vt: "+vt);
	}
	else if (rec.pathRec.videoDeltaT) {
	    report("**** videoDeltaT: "+rec.pathRec.videoDeltaT);
	    vt = t - rec.pathRec.videoDeltaT;
	    report("t: "+t);
	}
	else if (rec.pathRec.youtubeDeltaT) {
	    report("**** youtubeDeltaT: "+rec.pathRec.youtubeDeltaT);
	    vt = t + rec.pathRec.youtubeDeltaT;
	    report("Computing time");
	    report("trailTime: "+t);
	    report("playTime: "+vt);
        }
	if (e && e.shiftDown) {
	    report("***** shift down... updating delta!! ****");
	    var vt = WV.Trails.PREV_RT;
	    var newDelta = vt - t;
	    report("Adjusting delta");
	    report("playTime: "+vt);
	    report("trailTime: "+t);
	    rec.pathRec.youtubeDeltaT = newDelta;
	    report("new youtubeDeltaT: "+rec.pathRec.youtubeDeltaT);
	}
	else {
	    var playOpts = {'youtubeId': rec.pathRec.youtubeId, 't': vt}
	    report("playing prec: "+JSON.stringify(playOpts));
	    WV.playVid(playOpts);
	}
	return;
    }
    // We have a set of still image panaramas and and index
    var url = "http://tours.paldeploy.com:8001/pannellum/viewPano.html";
    url += "?imageId="+rec.tourName+"/"+idx;
    WV.showPage({url: url});
}

WV.Trails.moveHandler = function(rec, xy, xyz)
{
    report("WV.Trails.handleMove rec: "+rec);
    report("WV.Trails xy: "+xy+"  "+xyz);
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

WV.registerModule("WVTrails.js");

WV.registerRecHandler("robotTrail", WV.Trails.addTrail);
WV.registerRecHandler("dronePath", WV.Trails.addDroneTrail);
WV.registerRecHandler("model", WV.addModel);

WV.registerRecHandler("CoordinateSystem",
    function(layer, rec) {
        var csName = rec.coordSys;
	report("**** adding CoordinateSystem "+csName);
	WV.addCoordinateSystem(csName, rec);
    });


