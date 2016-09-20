
WV.Trails = {}

WV.Trails.defaultTrailWidth = 3;

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
		 width : WV.Trails.defaultTrailWidth,
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
    var showPoints = false;
    if (showPoints)
	for (var i=0; i<points.length; i++) {
	    WV.drawPoint(points[i]);
	}
    var addBillboard = true;
    if (addBillboard) {
	if (!rec.lon) {
	    var lla0 = WV.xyzToLla(data.recs[0].pos, coordSys);
	    rec.lat = lla0[0];
	    rec.lon = lla0[1];
	}
	rec.flyDur = 5;
	rec.height = 10000;
	rec.clickHandler = WV.Trails.onClickGoTo;
	WV.addBillboardToLayer(layer, rec);
    }
    return route;
}


/*
  Draw a point at a given position.  If an given is given
  id and a point with that id has already been drawn, it is
  repositioned to that point.
 */
WV.drawPoint = function(pos, id, size, color)
{
    if (id) {
	var pt = WV.viewer.entities.getById(id);
	if (pt) {
	    pt.position = pos;
	    return;
	}
    }
    size = size | 4;
    opts = {
        position : pos,
	point : {
            pixelSize : size,
        }
    }
    if (id)
	opts.id = id;
    if (color)
	opts.point.color = color;
    WV.viewer.entities.add(opts);
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

/*
  Linear search to find index i such that

  recs[i-1].rt <= rt   &&   rt <= recs[i]

  if rt < recs[0]                 returns i=0
  if rt < recs[recs.length-1].rt  returns recs.length
*/
WV.linSearch = function(recs, rt)
{
    for (var i=0; i<recs.length; i++) {
        if (recs[i].rt > rt)
	    return i;
    }
    return i;
}

/*
  Binary search.  Same contract as Linear search
  but should be faster.
 */
WV.binSearch = function(recs, rt)
{
    var iMin = 0;
    var iMax = recs.length-1;

    while (iMin < iMax) {
	var i = Math.floor((iMin + iMax)/2.0);
	var rec = recs[i];
	if (rec.rt == rt)
	    return i+1;
	if (rt > rec.rt) {
	    iMin = i;
	}
	else {
	    iMax = i;
	}
	if (iMin >= iMax-1)
	    break;
    }
    return iMin+1;
}

WV.testSearchFun1 = function(recs, searchFun)
{
    function correctPos(rt, recs, i) {
	//report("rt: "+rt+" i: "+i);
	if (i == 0) {
	    if (rt <= recs[0].rt)
		return true;
	    return false;
	}
	if (rt > recs[recs.length-1].rt && i == recs.length)
	    return true;
	if (recs[i-1].rt <= rt && rt <= recs[i].rt)
	    return true;
	return false;
    }

    //for (var i=0; i<recs.length; i++) {
    //  report(i+" "+recs[i].rt);
    //}
    var errs = 0;
    for (var i=0; i<recs.length-1; i++) {
	var rt = recs[i].rt;
	var ii = searchFun(recs, rt);
	if (!correctPos(rt, recs, ii)) {
	    report("error:  rt "+rt+"  -->  "+ii);
	    errs++;
	}
	rt = (recs[i].rt + recs[i+1].rt)/2.0;
	ii = searchFun(recs, rt);
	if (!correctPos(rt, recs, ii)) {
	    report("error:  rt "+rt+"  -->  "+ii);
	    errs++;
	}
    }
    return errs;
}

WV.testSearch = function(nrecs)
{
    nrecs = nrecs | 100000;
    report("WV.testSearch "+nrecs);
    recs = []
    for (var i=0; i<nrecs; i++) {
	recs.push( {i: i, rt: Math.random()*100000000 });
	//recs.push( {i: i, rt: Math.random()*10000 });
    }
    recs.sort(function(a,b) { return a.rt-b.rt; });
    for (var i=0; i<nrecs-1; i++) {
	if (recs[i].rt >= recs[i+1].rt) {
	    report("**** testSearch: recs not sorted ****");
	    return;
	}
	if (recs[i].rt == recs[i+1].rt) {
	    report("**** testSearch: recs not unique ****");
	    return;
	}
    }
    report("Testing Linear Search");
    var t1 = WV.getClockTime();
    var errs = WV.testSearchFun1(recs, WV.linSearch);
    var t2 = WV.getClockTime();
    report("lin searched "+nrecs+" times in "+(t2-t1)+" secs "+errs+" errors");
    report("Testing binary Search");
    var t1 = WV.getClockTime();
    var errs = WV.testSearchFun1(recs, WV.binSearch);
    var t2 = WV.getClockTime();
    report("bin searched "+nrecs+" times in "+(t2-t1)+" secs "+errs+" errors");
}

WV.findPointByTime = function(rec, rt)
{
    //report("WV.findPointByTime "+rt);
    //i = WV.linSearch(rec.data.recs, rt);
    i = WV.binSearch(rec.data.recs, rt);
    if (i == 0) {
	return {i: i, f: 0, nearestPt: rec.points[i]};
    }
    if (i >= rec.points.length) {
	i = rec.points.length-1;
	return {i: i, f: 1, nearestPt: rec.points[i]};
    }
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


WV.findNearestPoint0 = function(pt, points)
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

WV.findNearestPoint = function(pt, points)
{
    var dv = new Cesium.Cartesian3();
    var nv1 = new Cesium.Cartesian3();
    //report("fNP pt: "+pt);
    var c0 = WV.viewer.camera.position;
    //report("fNP c0: "+c0);
    Cesium.Cartesian3.subtract(c0,pt,dv);
    Cesium.Cartesian3.normalize(dv,nv1);
    //report("fNP pt: "+pt+"  nv1: "+nv1);
    var aMin = 1.0E10;
    iMin = 0;
    var v = new Cesium.Cartesian3();
    var nv2 = new Cesium.Cartesian3();
    for (var i=0; i<points.length; i++) {
	Cesium.Cartesian3.subtract(c0, points[i], v);
	Cesium.Cartesian3.normalize(v,nv2);
	//var a = Cesium.Cartesian3.angleBetween(nv, v);
	var a = Cesium.Cartesian3.angleBetween(nv1, nv2);
	if (a < aMin) {
	    aMin = a;
	    iMin = i;
	}
    }
    return {'i': iMin, nearestPt: points[iMin], 'd': aMin};
}


WV.Trails.PREV_RT = null;

WV.Trails.noticeTimeChange = function(rec, status)
{
    var rt = status.t;
    if (WV.Trails.PREV_RT == rt)
	return;
    WV.Trails.PREV_RT = rt;
    //report("noticeTimeChange "+rec.layerName+" "+rec.id+" rt: "+rt);
    var tt = rt - rec.pathRec.youtubeDeltaT;
    var res = WV.findPointByTime(rec, tt);
    //report("noticeTimeChange res: "+JSON.stringify(res));
    WV.updateCursor(rec, res.nearestPt);
}

WV.Trails.onClickGoTo = function(rec, xy, xyz, e, pickedObj)
{
    report("**** onClickGoTo...");
    var dur = 4;
    var height = 7000;
    if (rec.flyDur)
	dur = rec.flyDur;
    if (rec.height)
	height = rec.height;
    report("dur: "+dur+"  h: "+height);
    var dest = Cesium.Cartesian3.fromDegrees(
			    rec.lon, rec.lat, height);
    var opts = {destination: dest, duration: dur};
    report("**** flyTo opts: "+JSON.stringify(opts));
    //WV.viewer.flyTo(pickedObj, {duration: dur});
    WV.viewer.camera.flyTo(opts);
}

WV.Trails.handleClick = function(rec, xy, xyz, e, pickedObj)
{
    report("WV.Trails.handleClick rec: "+rec);
    report("WV.Trails xy: "+xy+"  "+xyz);
    RECX = rec;
    EE = e;
    if (rec.url) {
	WV.showPage(rec);
	return;
    }
    /*
    if (rec.pathRec.flyDur) {
	report("**** flyTo");
	if (pickedObj) {
	    var dur = rec.pathRec.flyDur;
	    var dest = Cesium.Cartesian3.fromDegrees(
			     rec.pathRec.lon, rec.pathRec.lat, 15000.0);
	    var opts = {destination: dest, duration: dur};
	    report("**** flyTo opts: "+opts);
	    //WV.viewer.flyTo(pickedObj, {duration: dur});
	    WV.viewer.camera.flyTo(opts);
	}
	else {
	    report("****** no object");
	}
    }
    */
    //WV.drawPoint(xyz, "click_point", 8, Cesium.Color.RED);
    var res = WV.findNearestPoint(xyz, rec.points);
    //report("res: "+JSON.stringify(res));
    RES_ = res;
    var frameRate = 29.97;
    var idx = 0;
    var dt = 0;
    var t = 0;
    var vt = null;
    if (res) {
	var data = rec.data;
	var startTime = data.startTime;
	//t = data.recs[res.i].time;
	//vt = data.recs[res.i].vt;
	//dt = t - startTime;
	dt = data.recs[res.i].rt;
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
	//if (vt != null) {
	//    report("**** vt: "+vt);
	//}
	if (rec.pathRec.videoDeltaT) {
	    report("**** videoDeltaT: "+rec.pathRec.videoDeltaT);
	    vt = t - rec.pathRec.videoDeltaT;
	    report("t: "+t);
	}
	else if (rec.pathRec.youtubeDeltaT) {
	    report("**** youtubeDeltaT: "+rec.pathRec.youtubeDeltaT);
	    vt = t + rec.pathRec.youtubeDeltaT;
	    report("trailTime: "+t+" playTime: "+vt);
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

WV.registerLayerType("trails", {
	moveHandler: WV.Trails.moveHandler
});

WV.registerRecHandler("robotTrail", WV.Trails.addTrail);
WV.registerRecHandler("dronePath", WV.Trails.addTrail);
WV.registerRecHandler("model", WV.addModel);

WV.registerRecHandler("CoordinateSystem",
    function(layer, rec) {
        var csName = rec.coordSys;
	report("**** adding CoordinateSystem "+csName);
	WV.addCoordinateSystem(csName, rec);
    });


