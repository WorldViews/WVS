
"use strict";

function report(str) { console.log(str); }

if (typeof WV == "undefined") {
    report("****** defining WV ******");
    var WV = {};
    if (typeof __webpack_require__ === 'function') {
        WV = require('WVCoordSys');
        L = require('leaflet');
        require('leaflet-geometryutil');
        require('leaflet-easybutton');
        require('leaflet-imageoverlay-rotated');
        var io = require('socket.io-client');
    }
}

var WVL = {};
window.WVL = WVL;
//WVL.homeSite = "Memorial Park";
WVL.homeSite = null;
WVL.showSitePlacemarks = true;
WVL.showTrackPlacemarks = false;
WVL.sites = {};
WVL.tracks = {};
WVL.currentTrack = null;
WVL.cursor = null;
WVL.currentPlayTime = 0;
WVL.lastSeekTime = 0;
WVL.playSpeed = 0;
WVL.homeLatLng = null;
WVL.homeBounds = null;
WVL.homeZoom = 17;
WVL.trackWatchers = [];
WVL.deviceClickWatchers = [];
WVL.poiEditable = true;
WVL.pois = [];
WVL.poiWatchers = [];
//WVL.toursUrl = "https://worldviews.org/static/data/tours_data.json";
//WVL.toursUrl = "/static/data/tours_data.json";
WVL.toursUrl = "/static/data/cherry_blossom_data.json";
WVL.indoorMaps = {};
//WVL.SIO_URL = window.location.protocol + '//' + window.location.hostname + ":4000/";
WVL.SIO_URL = "https://worldviews.org";
WVL.sock = null;
WVL.clientMarkers = {};
WVL.trackLayer = null;
WVL.layers = {};
WVL.layerControl = null;
WVL.osm = null;
WVL.googleSat = null;

WVL.Site = function(name)
{
    this.name = name;
    this.placemark = null;
    this.tracks = []
}

WVL.Site.prototype.addPlacemark = function(trackDesc)
{
    if (this.placemark)
	return;
    var trackDesc = this.tracks[0];
    var opts = {draggable: false, title: this.name};
    var gpos = trackDesc.data.latLng[0];
    //var gpos = [0,0];
    this.placemark =  L.marker(gpos, opts);
    //placemark.bindPopup(label).openPopup();
    this.placemark.addTo(WVL.map);
    this.placemark.on('click',
		      function(e) { WVL.clickOnPlacemark(e,trackDesc,gpos);});
}

WVL.Site.prototype.addTrack = function(trackDesc)
{
    this.tracks.push(trackDesc);
    if (WVL.showSitePlacemarks) {
	this.addPlacemark();
    }
}


WVL.ImageLayer = function(imageUrl, opts)
{
    this.map = WVL.map;
    this.marker1 = null;
    this.marker2 = null;
    this.marker3 = null;
    if (!(opts.p1 && opts.width && opts.height)) {
	report("**** bad arguments to WV.ImageLayer ****");
	return;
    }
    this.width = opts.width;
    this.height = opts.height;
    this.heading = opts.heading || 0;
    report("width: "+this.width);
    report("height: "+this.height);
    report("heading: "+this.heading)
    this.point1 = new L.LatLng(opts.p1[0],opts.p1[1]);
    this._updatePoints();
    this.overlay = L.imageOverlay.rotated(imageUrl, this.point1, this.point2, this.point3, {
	opacity: 0.8,
	interactive: false,
    });
    this.overlay.addTo(WVL.map);
    //this.addGrips();
    //this.fitBounds();
}

WVL.ImageLayer.prototype.fitBounds = function()
{
    var	bounds = new L.LatLngBounds(this.point1, this.point2).extend(this.point3);
    this.map.fitBounds(bounds);
}

WVL.ImageLayer.prototype.edit = function()
{
    var inst = this;
    if (!this.marker1) {
	this.marker1 = L.marker(this.point1, {draggable: true} ).addTo(this.map);
	this.marker1.on('drag dragend', function() {inst.handleTranslate()});
    }
    if (!this.marker2) {
	this.marker2 = L.marker(this.point2, {draggable: true} ).addTo(this.map);
	this.marker2.on('drag dragend', function() {inst.handleRotate()});
    }
    this.marker1._bringToFront();
    this.marker2._bringToFront();
}

WVL.ImageLayer.prototype.handleTranslate = function()
{
    report("handleTranslate");
    this.point1 = this.marker1.getLatLng();
    this._updatePoints();
    this.dump();
}

WVL.ImageLayer.prototype.handleRotate = function()
{
    report("handleRotate");
    var point2 = this.marker2.getLatLng();
    var h = L.GeometryUtil.bearing(this.point1, point2);
    this.setHeading(h);
}

WVL.ImageLayer.prototype.setHeading = function(h)
{
    report("setHeading "+h);
    this.heading = h;
    this._updatePoints();
}
WVL.ImageLayer.prototype.setHeading = function(h)
{
    report("setHeading "+h);
    this.heading = h;
    this._updatePoints();
}

WVL.ImageLayer.prototype.setWidth = function(w)
{
    report("setWidth "+w);
    this.width = w;
    this._updatePoints();
}

WVL.ImageLayer.prototype.setHeight = function(h)
{
    report("setHeight "+h);
    this.height = h;
    this._updatePoints();
}

WVL.ImageLayer.prototype._updatePoints = function()
{
    report(" p1: "+this.point1);
    //this.point2 = L.GeometryUtil.destination(this.point1, 90+this.heading, this.width);
    //this.point3 = L.GeometryUtil.destination(this.point1, 180+this.heading, this.height);
    this.point2 = L.GeometryUtil.destination(this.point1, this.heading, this.width);
    this.point3 = L.GeometryUtil.destination(this.point1, 90+this.heading, this.height);
    if (this.overlay)
        this.overlay.reposition(this.point1, this.point2, this.point3);
    this.updateGrips();
    this.dump();
}

WVL.ImageLayer.prototype.updateGrips = function(h)
{
    if (this.marker1) this.marker1.setLatLng(this.point1);
    if (this.marker2) this.marker2.setLatLng(this.point2);
    if (this.marker3) this.marker3.setLatLng(this.point3);
}

WVL.ImageLayer.prototype.dump = function()
{
    var p1 = this.point1;
    var obj = {'heading': this.h12, 'origin': [p1.lat, p1.lng]};
    report("map: "+JSON.stringify(obj));
}

WVL.zoom = function(e)
{
    var z = WVL.map.getZoom();
    report("***WVL.zoom z: "+z);
    WVL.pois.forEach(function(poi) {
	if (z < poi.minZoomLevel)
	    poi.mark.remove();
	else
	    poi.mark.addTo(WVL.map);
    });
}

WVL.openURL = function(url, winName)
{
    window.open(url, winName);
}

WVL.handleClickOnPOI = function(e, poi)
{
    if (poi.window)
	WVL.openURL(poi.url, poi.window);
    WVL.poiWatchers.forEach(function(w) { w(poi, e); });
}

WVL.handleDragPOI = function(e, poi)
{
    report("drag "+poi.name+"  latLng: "+e.latlng);
}

WVL.POI = function(rec)
{
    report("******** new POI **********");
    var inst = this;
    this.lat = rec.lat;
    this.lng = rec.lon;
    this.label = rec.label;
    this.url = rec.url;
    this.window = rec.window;
    this.minZoomLevel = rec.minZoomLevel || 0;
    var opts = {'title': this.label};
    if (WVL.poiEditable) {
	opts.draggable = true;
    }
    if (rec.icon) {
	opts.icon = L.icon(rec.icon);
    }
    this.mark =  L.marker([this.lat, this.lng], opts);
    var z = WVL.map.getZoom();
    if (this.minZoomLevel < z)
	this.mark.addTo(WVL.map);
    this.mark.on('click', function(e) { WVL.handleClickOnPOI(e, inst); });
    this.mark.on('drag', function(e) { WVL.handleDragPOI(e, inst); });
}

WVL.addPOI = function(rec)
{
    var poi = new WVL.POI(rec);
    WVL.pois.push(poi);
    return poi;
}

// A mark watcher function has signature
// watcher(poi, rec, event)
WVL.registerPOIWatcher = function(fun) {
    WVL.poiWatchers.push(fun);
}

// A watcher function has signature
// watcher(track, trec, event)
WVL.registerTrackWatcher = function(fun) {
    WVL.trackWatchers.push(fun);
}

// A watcher function has signature
// watcher(deviceId, deviceType, msg)
// where msg is the most recent status (position)
// message that came from the device.
WVL.registerDeviceClickWatcher = function(fun) {
    WVL.deviceClickWatchers.push(fun);
}

/*
  Use this instead of $.getJSON() because this will give
  an error message in the console if there is a parse error
  in the JSON.
 */
WVL.getJSON = function(url, handler)
{
    report(">>>>> getJSON: "+url);
    $.ajax({
        url: url,
	dataType: 'text',
	success: function(str) {
		var data = JSON.parse(str);
		handler(data);
	    }
	});
}

WVL.getClockTime = function()
{
    return new Date()/1000.0;
}

WVL.getPlayTime = function(t)
{
    var t = WVL.getClockTime();
    var t0 = WVL.lastSeekTime;
    var dt = (t-t0)*WVL.playSpeed;
    WVL.setPlayTime(WVL.currentPlayTime + dt);
    return WVL.currentPlayTime;
}

WVL.setPlayTime = function(t)
{
    WVL.lastSeekTime = WVL.getClockTime();
    WVL.currentPlayTime = t;
    if (!WVL.currentTrack)
        return;
    var ret = WVL.findPointByTime(WVL.currentTrack, t);
    if (!ret)
	return;
    WVL.setPoint(ret.nearestPt);
}

WVL.setViewHome = function()
{
    var ll = WVL.homeLatLng;
    //WVL.map.setView(new L.LatLng(ll.lat, ll.lng), WVL.homeZoom);
    WVL.map.flyTo(new L.LatLng(ll.lat, ll.lng), WVL.homeZoom);
}

WVL.distanceSquared = function(pt1, pt2)
{
    report
    var dx = pt1[0]-pt2[0];
    var dy = pt1[1]-pt2[1];
    var d2 = dx*dx + dy*dy;
    //report("dsq "+pt1+" "+pt2+"   d2: "+d2);
    return d2;
}

// bogus linear interp... for now just return first point...
WVL.lerp = function(pt1, pt2, f, pt)
{
    var x = (1-f)*pt1[0] + f*pt2[0];
    var y = (1-f)*pt1[1] + f*pt2[1];
    return [x,y];
}

WVL.timerFun = function(e)
{
    //var t = WVL.getPlayTime();
    //report("*** tick playTime: "+t);
    //setTimeout(WVL.timerFun, 100);
}

WVL.clickOnMap = function(e) {
    report("click on map e: "+e);
    report("latLng: "+e.latlng);
    var de = e.originalEvent;
    report("shift: "+de.shiftKey);
}

WVL.setCurrentTrack = function(track)
{
    report("-------------------------------");
    if (WVL.currentTrack == track)
	return;
    WVL.currentTrack = track;
    var desc = track.desc;
    var recType = desc.recType;
    if (recType && WVL.cursor && recType != WVL.cursor.recType) {
	report("***** Need to replace cursor *****");
	WVL.removeCursor();
	WVL.getCursor(recType);
    }
    report("setCurrentTrack id: "+desc.id);
    var videoId = desc.youtubeId;
    var videoDeltaT = desc.youtubeDeltaT;
    report("videoId: "+videoId);
    report("deltaT: "+videoDeltaT);
}

WVL.clickOnTrack = function(e, track) {
    report("click on track e: "+e);
    report("name: "+track.name);
    report("trail: "+track.trail);
    report("latLng: "+e.latlng);
    WVL.setCurrentTrack(track);
    var de = e.originalEvent;
    report("shift: "+de.shiftKey);
    var pt = [e.latlng.lat, e.latlng.lng];
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
    //WVL.setPlayTime(trec.rt);
    var latLng = [trec.pos[0], trec.pos[1]];
    WVL.setPoint(latLng);
    WVL.trackWatchers.forEach(function (w) { w(track, trec, e); })
}

WVL.clickOnPlacemark = function (e, trackDesc, gpos) {
    //WVL.map.setView(new L.LatLng(gpos[0], gpos[1]),18, {animate: true, duration: 0.5});
    WVL.map.flyTo(new L.LatLng(gpos[0], gpos[1]),18);
};

var E;
WVL.LOCK = true;
WVL.dragPlacemark = function (e, trackDesc, gpos) {
    report("dragging placemark gpos: "+gpos);
    var placemark = trackDesc.placemark;
    E = e;
    if (!WVL.LOCK) {
	var t1 = WVL.getClockTime();
	var npt = placemark.getLatLng();
	//placemark.setLatLng(npt);
	var data = trackDesc.data;
	//var coordSys = data.coordinateSystem;
	var coordSys = trackDesc.coordSys;
	report("coordSys: "+coordSys);
	var cs = WV.coordinateSystems[coordSys]
	report("cs before: "+JSON.stringify(cs));
	//WV.updateCoordinateSystem(cs, npt.lat, npt.lng);
	cs.update(npt.lat, npt.lng);
	report("cs after: "+JSON.stringify(cs));
	WVL.updateTrack(trackDesc.data);
	var t2 = WVL.getClockTime();
	report("updated in "+(t2-t1)+" secs");
    }
};

WVL.removeCursor = function()
{
    if (!WVL.cursor)
	return;
    WVL.cursor.remove();
    WVL.cursor = null;
}

WVL.getCursor = function()
{
    if (!WVL.cursor) {
	var recType = null;
	if (WVL.currentTrack)
	    recType = WVL.currentTrack.desc.recType;
	var iconOpts = WVL.iconOpts['360cam'];
	if (recType == "dronePath")
	    iconOpts = WVL.iconOpts['drone'];
	var icon = L.icon(iconOpts);
        var opts = {'title': 'Camera Position', icon: icon};
        //var marker = L.marker([lat, lng],opts).addTo(WVL.map);
	WVL.cursor = L.marker([0,0], opts);
	WVL.cursor.addTo(WVL.map);
    }
    return WVL.cursor;
}

WVL.setPoint = function(latLng)
{
    WVL.getCursor().setLatLng(latLng);
}

WVL.addLayerControl = function()
{
   //var group1 = L.layerGroup([littleton, denver, aurora, golden]);
//    var overlayMaps = {
//	"Trails": WVL.trackLayer,
//    };
    //L.control.layers(null, WVL.layers).addTo(WVL.map);
    var maps = {'OpenStreetMap': WVL.osm,
		'Google Sattelite': WVL.googleSat};
    WVL.layerControl = L.control.layers(maps, WVL.layers).addTo(WVL.map);
}

WVL.initmap = function(latlng, bounds) {
    // set up the map
    var map = new L.Map('map');
    WVL.map = map;
    WVL.trackLayer = L.layerGroup();
    //WVL.layers['Trails'] = WVL.trackLayer;
    WVL.layers['Main Trail'] = WVL.trackLayer;
    WVL.trackLayer.addTo(map);
    WVL.homeLatLng = latlng;
    WVL.homeBounds = bounds;
    map.on('click', WVL.clickOnMap);
    map.on('zoom', WVL.zoom);
    
    // create the tile layer with correct attribution
    var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    //var osm = new L.TileLayer(osmUrl, {minZoom: 17, maxZoom: 19, attribution: osmAttrib});
    var osm = new L.TileLayer(osmUrl, {minZoom: 5, maxZoom: 21, attribution: osmAttrib});
    WVL.osm = osm;
    WVL.googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
	maxZoom: 20,
	subdomains:['mt0','mt1','mt2','mt3']
    });    
    //map.setView(new L.LatLng(latlng.lat, latlng.lng),18);
    map.setView(new L.LatLng(latlng.lat, latlng.lng),17);
    map.addLayer(osm);
    //map.addLayer(googleSat);

    // var helloPopup = L.popup().setContent('Hello World!');
    L.easyButton('fa-globe fa-fixed fa-lg', function(btn, map){
	WVL.setViewHome();
    }).addTo(map);

    //WVL.loadTracksFromAPI(map);
    //WVL.loadTracksFromFile(WVL.toursUrl, map);
    WVL.getCursor();
    WVL.setPlayTime(0)
    setTimeout(WVL.timerFun, 500);
    setInterval(WVL.pruneOldClientMarkers, 3000);

    WVL.addLayerControl();
/*
    //var point1 = L.latLng(40.52256691873593, -3.7743186950683594);
    var imageUrl = "http://cdn.calatlantichomes.com/images/webplanlevelsvg/3c4f705b-1e95-e411-8342-02bfcd947d8b/image.svg.gzip?v=63591147145";
    var point1 = [40.52256691873593, -3.7743186950683594];
    var point2 = [40.5210255066156, -3.7734764814376835];
    var point3 = [40.52180437272552, -3.7768453359603886];
    var mimg = new WVL.ImageLayer(imageUrl, point1, point2, point3);
*/
}

//
//var TD;
WVL.handleTrack = function(trackDesc, trackData, url, map)
{
    var name = trackData.name;
    trackData.desc = trackDesc;  //*** NOTE: these set up a circular reference
    trackDesc.data = trackData;
    WVL.tracks[name] = trackData;
    report("handleTrailData "+url);
    WVL.computeTrackPoints(trackData);
    var color = '#3333ff';
    if (trackDesc.recType == 'dronePath')
	color = '#33ff33';
    var opts = { color: color, weight: 2};
    trackData.trail = L.polyline(trackData.latLng, opts);
    trackData.backing = L.polyline(trackData.latLng,
				     {color: color, weight: 10, opacity: 0.1});
    //trackData.trail.on('click', function(e) { WVL.clickOnTrack(e, trackData);});
    trackData.backing.on('click', function(e) { WVL.clickOnTrack(e, trackData);});
    //trackData.trail.addTo(map);
    var trackLayerName = trackDesc.layerName;
    if (!trackLayerName)
	//trackLayerName = "Trails";
	trackLayerName = "Main Trail";
    var trackLayer = WVL.layers[trackLayerName];
    if (!trackLayer) {
        report("***************************");
	trackLayer = L.layerGroup();
	WVL.layers[trackLayerName] = trackLayer;
	if (trackLayerName == "Drone")
	    trackLayer.addTo(WVL.map);
	//L.control.layers(null, WVL.layers).addTo(WVL.map);
	if (WVL.layerControl)
	    WVL.layerControl.addOverlay(trackLayer, trackLayerName);
    }
    trackData.trail.addTo(trackLayer);
    trackData.backing.addTo(trackLayer);
    var gpos = trackData.latLng[0];
    trackDesc.map = map;
    trackDesc.placemark = null;
    if (trackDesc.site) {
	trackDesc.site.addTrack(trackDesc);
    }
    if (WVL.showTrackPlacemarks) {
	//var label = "Hello There";
	var label = trackDesc.description;
	var opts = {draggable: true};
	if (label)
	    opts.title = label;
	var placemark =  L.marker(gpos, opts);
	trackDesc.placemark = placemark;
	//placemark.bindPopup(label).openPopup();
	placemark.addTo(map);
	placemark.on('click',
		     function(e) { WVL.clickOnPlacemark(e,trackDesc,gpos);});
	placemark.on('drag dragend',
		     function(e) { WVL.dragPlacemark(e,trackDesc,gpos);});
    }
}

WVL.updateTrack = function(trackData)
{
    report("updateTrack");
    WVL.computeTrackPoints(trackData);
    var desc = trackData.desc;
    trackData.trail.setLatLngs(trackData.latLng);
}

WVL.computeTrackPoints = function(trackData)
{
    var desc = trackData.desc;
    var recs = trackData.recs;
    var h = 2;
    var coordSys = trackData.coordinateSystem;
    if (!coordSys) {
	coordSys = desc.coordSys;
    }
    if (!coordSys) {
	report("*** no coodinateSystem specified");
	coordSys = "GEO";
    }
    var latLng = [];
    for (var i=0; i<recs.length; i++) {
	var pos = recs[i].pos;
	var lla = WV.xyzToLla(pos, coordSys);
	//latLng.push([pos[0], pos[1]]);
	latLng.push([lla[0], lla[1]]);
    }
    //report("latLng: "+latLng);
    trackData.latLng = latLng;    
}

WVL.loadTrackFromAPI = function(trackDesc, map)
{
    //var url = "/api/v1/track/"+idmempark_Mar_23_2017_11_25_28_AM_2017-03-23_11-25-28";
    var trackId = trackDesc.id;
    var url = "/api/v1/track/"+trackId;
    WVL.getJSON(url, function(data) {
        //report("GOT JSON: "+data);
	WVL.handleTrack(trackDesc, data, url, map);
    });
}

WVL.loadTracksFromAPI = function(map)
{
    var url = "/api/v1/track/mempark_Mar_23_2017_11_25_28_AM_2017-03-23_11-25-28";
    var trackDescs = [{"id": "mempark_Mar_23_2017_11_25_28_AM_2017-03-23_11-25-28",
		  "youtubeId": "iJ9V3WVmRgc",
		  "youtubeDeltaT": -282.0
		 }];
    trackDescs.forEach(function (trackDesc) { WVL.loadTrackFromAPI(trackDesc, map); });
}

WVL.loadTrackFromFile = function(trackDesc, url, map)
{
    WVL.getJSON(url, function(data) {
        //report("GOT JSON: "+data);
	WVL.handleTrack(trackDesc, data, url, map);
    });
}

WVL.iconOpts = {
    //'drone': '/img/billboards/tbd_drone_icon.png',
    'drone': {
	'iconUrl': '/static/img/billboards/drone.png',
	'iconSize': [32,32]
    },
    'robot': {
	'iconUrl': '/static/img/billboards/double-robotics-2.png',
	'iconSize': [32,32]
    },
    '360cam': {
	'iconUrl': '/static/img/icons/360cam.png',
	'iconSize': [32,32]
    },
    'android': {
	'iconUrl': '/static/img/billboards/hiking.png',
	'iconSize': [32,32],
    },
    'test': {
	'iconUrl': '/static/img/billboards/hiking.png',
	'iconSize': [32,32],
    }
};
//iconAnchor: [22, 94],
//popupAnchor: [-3, -76],
//shadowUrl: 'my-icon-shadow.png',
//shadowRetinaUrl: 'my-icon-shadow@2x.png',
//shadowSize: [68, 95],
//shadowAnchor: [22, 94]

WVL.handleSIOMessage = function(msg)
{
    report("WVL received position msg: "+JSON.stringify(msg));
    var clientId = msg.clientId;
    var clientType = msg.clientType;
    var marker = WVL.clientMarkers[clientId];
    var lat = 0;
    var lng = 0;
    if (!msg.position || msg.position.length < 2) {
        return
    }
    lat = msg.position[0];
    lng = msg.position[1];
    //report("*** lat: "+lat+"   lng: "+lng);
    if (lat == -180 && lng == -180) {
	report("*** ignoring bogus position ***");
	return;
    }
    if (marker) {
        console.log("AdjustMarker "+clientId);
        //clientMarkers[clientId].setLatLng(L.latLng(lat,lng));
        marker.setLatLng([lat,lng]);
    }
    else {
        console.log("CreateMarker "+clientId);
	var iconOpts = WVL.iconOpts[clientType];
	if (!iconOpts) {
	    iconOpts = {iconUrl: "/static/img/billboards/purplePlacemark.png",
			iconSize: [32,32]
		       };
	}
	report("clientType: "+clientType);
	report("iconOpts: "+JSON.stringify(iconOpts));
	var myIcon = L.icon(iconOpts);
        var opts = {'title': clientId, icon: myIcon};
        var marker = L.marker([lat, lng],opts).addTo(WVL.map);
	//marker.bindPopup(clientId);
	//marker.openPopup();
        marker.on('click', function(e) { WVL.clickOnDeviceMarker(e,clientId, clientType, marker); });
        WVL.clientMarkers[clientId] = marker;
    }
    marker.mostRecentMessage = msg;
    marker.mostRecentTime = WVL.getClockTime();
}

WVL.pruneOldClientMarkers = function()
{
    //report("pruneOldClientMarkers");
    var t = WVL.getClockTime();
    var deadIds = [];
    Object.keys(WVL.clientMarkers).forEach(function(id) {
	//report("pruneOldClientMarkers "+id);
	var marker = WVL.clientMarkers[id];
	var dt = t - marker.mostRecentTime;
	if (dt > 10) {
	    marker.setOpacity(.2);
	}
	if (dt > 30) {
	    deadIds.push(id);
	}
    });
    deadIds.forEach(function(id) {
	report("deleting old client marker "+id);
	var marker = WVL.clientMarkers[id];
	marker.remove();
	delete WVL.clientMarkers[id];
    });
}

WVL.clickOnDeviceMarker = function(e, clientId, clientType, marker)
{
    report("WVL.clickOnDeviceMarker "+clientId+" "+clientType);
    WVL.deviceClickWatchers.forEach(function (w) { w(clientId, clientType, marker.mostRecentMessage); });
}

WVL.watchPositions = function()
{
    report("************** watch Positions *************");
    WVL.sock = io(WVL.SIO_URL);
    WVL.sock.on('position', WVL.handleSIOMessage);
}

WVL.match = function(s1,s2) { return s1.toLowerCase() == s2.toLowerCase() };

WVL.handleLayerRecs = function(tours, url, map)
{
    report("got tours data from "+url);
    tours.records.forEach(function (rec) {
	var trackDesc = rec;
	if (WVL.match(rec.recType, "GeoRecords")) {
	    WVL.loadTracksFromFile(rec.url);
	    return;
	}
	if (WVL.match(rec.recType, "POI")) {
	    WVL.addPOI(rec);
	}
	if (WVL.match(trackDesc.recType, "IndoorMap")) {
	    report("**** indoor map "+JSON.stringify(trackDesc));
	    var imap = trackDesc;
	    var p1 = imap.p0;
	    var p2 = [p1[0]+.001, p1[1]];
	    var p3 = [p1[0], p1[1]+0.001];
	    var imlayer = new WVL.ImageLayer(imap.imageUrl,
					     {p1: p1,
					      width: imap.width,
					      height: imap.height,
					      heading: imap.heading});
//	    var imlayer = new WVL.ImageLayer(imap.imageUrl, {p1: p1, p2: p2, p3: p3});
	    WVL.indoorMaps[imap.id] = imlayer;
	    //imlayer.edit();
	    return;
	}
	if (trackDesc.recType.toLowerCase() == "coordinatesystem") {
	    report("**** coordinateSystem "+JSON.stringify(trackDesc));
	    WV.addCoordinateSystem(trackDesc.coordSys, trackDesc);
	    return;
	}
	if (trackDesc.recType != "robotTrail" && trackDesc.recType != "dronePath") {
	    return;
	}
	var trackId = trackDesc.id;
	var siteName = trackDesc.site;
	if (!siteName)
	    siteName = trackDesc.description;
	if (siteName) {
	    if (!WVL.sites[siteName]) {
		WVL.sites[siteName] = new WVL.Site(siteName);
	    }
	    trackDesc.site = WVL.sites[siteName];
	}
	report("tour.tourId: "+trackId);
	var dataUrl = trackDesc.dataUrl;
	if (WVL.homeSite && siteName != WVL.homeSite) {
	    return;
	}
	WVL.loadTrackFromFile(trackDesc, dataUrl, map);
    });
}

WVL.loadTracksFromFile = function(url, map)
{
    report("**** WVL.loadTracksFromFile "+url);
    if (!map)
	map = WVL.map;
    WVL.getJSON(url, function(data) {
        WVL.handleLayerRecs(data, url, map);
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

WVL.findPointByTime = function(track, rt)
{
    //report("WVL.findPointByTime "+rt);
    //i = WVL.linSearch(rec.data.recs, rt);
    var recs = track.recs;
    var points = track.latLng;
    var i = WVL.binSearch(recs, rt);
    if (i == 0) {
	return {i: i, f: 0, nearestPt: points[i]};
    }
    if (i >= points.length) {
	i = points.length-1;
	return {i: i, f: 1, nearestPt: points[i]};
    }
    var i0 = i-1;
    var rt0 = recs[i0].rt;
    var rt01 = recs[i].rt - rt0;
    var f = (rt - rt0) / rt01;
    //report("i0: "+i0+" i: "+i+"  f: "+f);
    var p0 = points[i0];
    var p1 = points[i];
    //Cesium.Cartesian3.lerp(rec.points[i0], rec.points[i], f, pt);
    var pt = WVL.lerp(points[i0], points[i], f, pt);
    return {i: i, f: f, nearestPt: pt};
}


WVL.findNearestPoint = function(pt, points)
{
    report("findNearestPoint: pt: "+pt+" npoints: "+points.length);
    if (points.length == 0) {
	report("findNearestPoint called with no points");
	null;
    }
    var d2Min = WVL.distanceSquared(pt, points[0]);
    var iMin = 0;
    for (var i=1; i<points.length; i++) {
	var d2 = WVL.distanceSquared(pt, points[i]);
	if (d2 < d2Min) {
	    d2Min = d2;
	    iMin = i;
	}
    }
    return {'i': iMin, nearestPt: points[iMin], 'd': Math.sqrt(d2Min)};
}
if (typeof module !== 'undefined') {
    module.exports = exports = WVL;
}
