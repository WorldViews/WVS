
function report(str) { console.log(str); }

report("************** Leaflet *******************");

WVL = {};
WVL.tracks = {};

// convenience for debugging...
TRACK = null;
var PT = null;
//var DE = null;

WVL.distanceSquared = function(pt1, pt2)
{
    report
    var dx = pt1[0]-pt2[0];
    var dy = pt1[1]-pt2[1];
    var d2 = dx*dx + dy*dy;
    //report("dsq "+pt1+" "+pt2+"   d2: "+d2);
    return d2;
}


WVL.clickOnMap = function(e) {
    report("click on map e: "+e);
    report("latLng: "+e.latlng);
    var de = e.originalEvent;
    report("shift: "+de.shiftKey);
}

WVL.clickOnTrack = function(e, track) {
    report("click on track e: "+e);
    report("name: "+track.name);
    report("trail: "+track.trail);
    report("latLng: "+e.latlng);
    var de = e.originalEvent;
    report("shift: "+de.shiftKey);
    var pt = [e.latlng.lat, e.latlng.lng];
    PT = pt;
    report("pt: "+pt);
    var ret = WVL.findNearestPoint(pt, track.latLng);
    report("ret: "+JSON.stringify(ret));
    if (!ret)
	return;
    var i = ret.i;
    var trec = track.recs[i];
    report("trec: "+JSON.stringify(trec));
    if (!trec)
	return;
    var rt = trec.rt;
    report("****** seek to "+rt);
}


WVL.initmap = function(latlng, bounds) {
    // set up the map
    var map = new L.Map('map');
    WVL.map = map;
    map.on('click', WVL.clickOnMap);
    
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 17, maxZoom: 19, attribution: osmAttrib});

    // start the map in South-East England
    map.setView(new L.LatLng(latlng.lat, latlng.lng),18);
    map.addLayer(osm);

    // var helloPopup = L.popup().setContent('Hello World!');
    L.easyButton('fa-globe fa-fixed fa-lg', function(btn, map){
        map.fitBounds(bounds);
        // helloPopup.setContent(JSON.stringify(map.getCenter(), 0, 2))
        // helloPopup.setLatLng(map.getCenter()).openOn(map);
    }).addTo(map);

/*
    var gpx = '/static/data/paths/mempark_Mar_23,_2017_11_25_28_AM_2017-03-23_11-25-28.gpx';
    new L.GPX(gpx, {
        async: true,
        marker_options: {
            startIconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.3.0/pin-icon-start.png',
            endIconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.3.0/pin-icon-end.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.3.0/pin-shadow.png',
            clickable: true
        },
        polyline_options: {
//            color: '#ffc34d',
            color: '#ff3333',
            weight: 5
        }
    }).on('loaded', function(e) {
        //map.fitBounds(e.target.getBounds());
    }).on('click', function(e) {
        console.log(e.target);
    })
    .addTo(map);
*/
    WVL.loadTracks(map);
}

WVL.handleTrack = function(track, url, map)
{
    TRACK = track;
    var name = track.name;
    WVL.tracks[name] = track;
    //report("data: "+JSON.stringify(track));
    var recs = track.recs;
    var h = 2;
    var coordSys = track.coordinateSystem;
    if (!coordSys) {
	report("*** no coodinateSystem specified");
	coordSys = "GEO";
    }
    report("handleTrailData "+url+" coordSys: "+coordSys+" map: "+map);
    var latLng = [];
    for (var i=0; i<recs.length; i++) {
	var pos = recs[i].pos;
	latLng.push([pos[0], pos[1]]);
    }
    //report("latLng: "+latLng);
    track.latLng = latLng;
    track.trail = L.polyline(latLng, { color: '#3333ff', weight: 8});
    track.trail.on('click', function(e) { WVL.clickOnTrack(e, track);});
    track.trail.addTo(map);
}

WVL.loadTracks = function(map)
{
    var url = "/api/v1/track/mempark_Mar_23_2017_11_25_28_AM_2017-03-23_11-25-28";
    $.getJSON(url, function(data) {
        //report("GOT JSON: "+data);
	WVL.handleTrack(data, url, map);
    });
}




/*
  Linear search to find index i such that

  recs[i-1].rt <= rt   &&   rt <= recs[i]

  if rt < recs[0]                 returns i=0
  if rt < recs[recs.length-1].rt  returns recs.length
*/
WVL.linSearch = function(recs, rt)
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
WVL.binSearch = function(recs, rt)
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

WVL.testSearchFun1 = function(recs, searchFun)
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

WVL.testSearch = function(nrecs)
{
    nrecs = nrecs | 100000;
    report("WVL.testSearch "+nrecs);
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
    var t1 = WVL.getClockTime();
    var errs = WVL.testSearchFun1(recs, WVL.linSearch);
    var t2 = WVL.getClockTime();
    report("lin searched "+nrecs+" times in "+(t2-t1)+" secs "+errs+" errors");
    report("Testing binary Search");
    var t1 = WVL.getClockTime();
    var errs = WVL.testSearchFun1(recs, WVL.binSearch);
    var t2 = WVL.getClockTime();
    report("bin searched "+nrecs+" times in "+(t2-t1)+" secs "+errs+" errors");
}

WVL.findPointByTime = function(rec, rt)
{
    //report("WVL.findPointByTime "+rt);
    //i = WVL.linSearch(rec.data.recs, rt);
    i = WVL.binSearch(rec.data.recs, rt);
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
WVL.findPointByTime = function(rec, rt)
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


WVL.findNearestPoint = function(pt, points)
{
    report("findNearestPoint: pt: "+pt+" npoints: "+points.length);
    if (points.length == 0) {
	report("findNearestPoint called with no points");
	null;
    }
    var d2Min = WVL.distanceSquared(pt, points[0]);
    iMin = 0;
    for (var i=1; i<points.length; i++) {
	var d2 = WVL.distanceSquared(pt, points[i]);
	if (d2 < d2Min) {
	    d2Min = d2;
	    iMin = i;
	}
    }
    return {'i': iMin, nearestPt: points[iMin], 'd': Math.sqrt(d2Min)};
}

/*
WVL.findNearestPointFancy = function(pt, points)
{
    var dv = new Cesium.Cartesian3();
    var nv1 = new Cesium.Cartesian3();
    //report("fNP pt: "+pt);
    var c0 = WVL.viewer.camera.position;
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
*/


