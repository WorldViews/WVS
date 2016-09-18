
var WV = {};

function report(str)
{
    console.log(str);
}

WV.screenSpaceEventHandler = null;
//WV.layersUrl = "data/layers.json";
WV.layersUrl = "/static/data/layers.json";
WV.defaultBillboardIconURL = "/images/mona_cat.jpg";
//WV.defaultAnchorIconURL = "/Viewer/images/purplePlacemark.png";
WV.defaultAnchorIconURL = "/static/img/purplePlacemark.png";
WV.playVideoInIframe = true;
WV.showPagesInIframe = true;
WV.prevEndId = null;
WV.numBillboards = 0;
WV.bbScaleUnselected = 0.08;
WV.bbScaleSelected = 0.12;
WV.currentBillboard = null;
WV.viewer = null;
WV.scene = null;
WV.thisPersonData = null;
WV.origin = [0,0];
WV.curPos = null;
WV.myId = "_anon_"+new Date().getTime();
WV.myName = "anon";
WV.numPolls = 0;
WV.recs = {};
WV.useSocketIO = false;
WV.statusInterval = 1000;
var wvCom = null;

Cesium.BingMapsApi.defaultKey = "ApkF-vdI2ix3rcw-JCklfZG98zznVZfuAzRGf1khbyRZrev_qYq032B23YtYa-eX";

var cesiumContainer = document.getElementById('cesiumContainer');

WV.viewer = new Cesium.Viewer('cesiumContainer', {
	//    imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
	//        url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
	//	enablePickFeatures: false
	//    }),
    animation: false,
    timeline : false,
    //animation: true,
    //timeline : true,
    //    fullscreenElement : cesiumContainer,
    baseLayerPicker : true
});
WV.entities = WV.viewer.entities;
WV.scene = WV.viewer.scene;				 
WV.scene.globe.depthTestAgainstTerrain = true;

WV.getLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(WV.handleLocation);
    } else {
        report("Geolocation is not supported by this browser.");
    }
}

WV.handleLocation = function(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    WV.origin = [lat,lon];
    WV.curPos = [lat,lon, 1000000];
    report("lat: " + lat + "lon: " + lon);
    report("pos: "+JSON.stringify(position));
    WV.thisPersonData = { 'op': 'create',
			  'id': 'person0',
			  't': WV.getClockTime(),
			  'origin': WV.origin };
}


WV.getTwitterImages = function(url)
{
    report("***** getTwitterImages ******");
    var layer = WV.layers["photos"];
    if (layer.billboards == null)
	layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.getJSON("data/imageTweets_data.json", WV.handleImageRecs);
    WV.scene.primitives.add(layer.bbCollection);
    wvCom.subscribe("photos", WV.handleImageRecs);
}

//function handleImageRecs(data)
WV.handleImageRecs = function(recs)
{
    report("****** handleImageRecs ******");
    recs = WV.getRecords(recs);
    report("num recs: "+recs.length);
    var layer = WV.layers["photos"];
    var maxNumRecs = 2;
    var tailRecs = null;
    if (recs.length > maxNumRecs) {
	report("slicing...");
	tailRecs = recs.slice(maxNumRecs);
	recs = recs.slice(0,maxNumRecs-1);
    }
    report("num recs now: "+recs.length);
    var imageList = recs;
    for (var i=0; i<imageList.length; i++) {
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
        var ispec = imageList[i];
        //report(" i: "+i+"  "+JSON.stringify(ispec));
	var id = ispec.id;
        WV.prevEndId = id;
        var imageUrl = ispec.imageUrl;
        if (!imageUrl)
            imageUrl = layer.imageServer+"images/twitter_images/"+id+"_p2.jpg";
        //imageUrl = "image1.jpg";
        var lon = ispec.lonlat[0];
        var lat = ispec.lonlat[1];
        var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl, id,
				layer.scale, layer.height, layer.showTethers);
        layer.billboards[id] = b;
	b.show = layer.visible;
	b._wvid = id;
	report("ispec: "+JSON.stringify(ispec));
    }
    if (tailRecs != null) {
	setTimeout(function() { WV.handleImageRecs(tailRecs); }, 200);
    }
}

function tryToFindRec(obj)
{
    report("tryToFindRec: "+obj);
    if (!obj || !obj.id)
	return null;
    id = obj.id._id;
    report("id "+id);
    rec = WV.recs[id];
    report("rec: "+rec);
    return rec;
}

WV.leftDown = function(e)
{
    report("left down.....");
    if (e.shiftDown)
	report("*** shift ***");
    if (e.ctrlDown)
	report("*** shift ***");
    var pickedObject = WV.scene.pick(e.position);
    if (!Cesium.defined(pickedObject)) {
	return;
    }
    //cpo = pickedObject;
    var id = pickedObject.id;
    var rec = WV.recs[id];
    if (!rec) {
	rec = tryToFindRec(pickedObject);
    }
    if (!rec) {
	report("Cannot find rec for id: "+id);
	PICKED_OBJ = pickedObject;
	BAD_ID = id;
	return;
    }
    var layerName = rec.layerName;
    var layer = WV.layers[layerName];
    if (!layer) {
	report("no layer for layerName: "+layerName+" id: "+id+" rec: "+WV.toJSON(rec));
	return;
    }
    report("click picked..... pickedObject._id "+id);
    var rec = layer.recs[id];
    layer.pickHandler(rec);
    //WV.playVid(rec);
}

WV.setupCesium = function()
{
    // If the mouse is over the billboard, change its scale and color
    var handler = new Cesium.ScreenSpaceEventHandler(WV.scene.canvas);
    WV.screenSpaceEventHandler = handler;
    handler.setInputAction(function(movement) {
        var pickedObject = WV.scene.pick(movement.endPosition);
	if (!Cesium.defined(pickedObject)) {
            if (WV.currentBillboard) {
                WV.currentBillboard.scale = WV.currentBillboard.unselectedScale;
		if (WV.currentBillboard.tether) {
		    //WV.currentBillboard.tether.show = false;
		}
	    }
            WV.currentBillboard = null;
            return;
        }
        //mpo = pickedObject;
        var id = pickedObject.id;
	_PICKED_OBJ_ = pickedObject;
	var rec = WV.recs[id];
	if (rec == null || typeof(id) == "object") {
	    id = id.id;
	    rec = WV.recs[id];
	}
	if (rec == null) {
	    report("trying _wvRec");
	    rec = pickedObject.id._wvRec;
	}
	if (rec == null) {
	    report("***** setupCesium no rec for id: "+id);
	    //report("***** setupCesium no rec for id: "+JSON.stringify(id));
	    _ID_ = id;
	    return;
	}
	//var layerName = WV.recs[id].layerName;
	var layerName = rec.layerName;
	var layer = WV.layers[layerName];
	if (!layer) {
	    report("no layer for layerName: "+layerName+" id: "+id+" rec: "+WV.toJSON(rec));
	    return;
	}
        //report("move over id "+id);
	if (!layer.billboards) {
	    report("no billboards for layer "+layerName);
	    return;
	}
        var b = layer.billboards[id];
	if (b == null && layer.picbillboards) {
	    report("*** hack for picbillboards... ***");
	    b = layer.picbillboards[id];
	    report("b: "+b);
	}
	if (b == null) {
	    report("checking moveHandler for layer "+layerName);
	    if (layer.moveHandler) {
		report("calling it...");
		var pickPos = WV.scene.pickPosition(movement.endPosition);
		layer.moveHandler(rec, movement.endPosition, pickPos);
	    }
	    return;
	}
        if (WV.currentBillboard && b != WV.currentBillboard) {
            WV.currentBillboard.scale = WV.currentBillboard.unselectedScale;
	    if (WV.currentBillboard.tether) {
		//WV.currentBillboard.tether.show = false;
	    }
        }
        WV.currentBillboard = b;
        //report("b.scale "+b.scale);
        //b.scale = WV.bbScaleSelected;
        b.scale = 1.5*b.unselectedScale;
	if (b.tether) {
	    b.tether.show = true;
	}
	else {
	    // could have made tethers lazy and add
	    // here as needed.   Maybe do that later.
	}
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


    handler.setInputAction(function(e) {
	    report("left down.....");
	    if (e.shiftDown)
		report("*** shift ***");
	    if (e.ctrlDown)
		report("*** shift ***");
	    var pickedObject = WV.scene.pick(e.position);
	    if (!Cesium.defined(pickedObject)) {
		return;
	    }
	    //cpo = pickedObject;
	    var id = pickedObject.id;
	    var rec = WV.recs[id];
	    if (!rec) {
		rec = tryToFindRec(pickedObject);
	    }
	    if (!rec) {
		report("Cannot find rec for id: "+id);
		PICKED_OBJ = pickedObject;
		BAD_ID = id;
		return;
	    }
	    var layerName = rec.layerName;
	    var layer = WV.layers[layerName];
	    if (!layer) {
		report("no layer for layerName: "+layerName+" id: "+id+" rec: "+WV.toJSON(rec));
		return;
	    }
	    report("click picked..... pickedObject._id "+id);
	    var rec = layer.recs[id];
	    layer.pickHandler(rec);
	    //WV.playVid(rec);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    /*
    handler.setInputAction(WV.leftDown,
			   Cesium.ScreenSpaceEventType.LEFT_DOWN);
    */
    /*
    handler.setInputAction(function (e) { e.shiftDown = true; WV.leftDown(e) },
			   Cesium.ScreenSpaceEventType.LEFT_DOWN,
			   Cesium.KeyboardEventModifier.SHIFT);

    handler.setInputAction(function (e) { e.ctrlDown = true; WV.leftDown(e) },
			   Cesium.ScreenSpaceEventType.LEFT_DOWN,
			   Cesium.KeyboardEventModifier.CTRL);
    */

    handler.setInputAction(function(e) {
        report("LEFT_CLICK e: "+JSON.stringify(e));
        var pickedObject = WV.scene.pick(e.position);
	if (!Cesium.defined(pickedObject)) {
            return;
        }
	var pickPos = WV.scene.pickPosition(e.position);
        cpo = pickedObject;
        var id = pickedObject.id;
	var rec = WV.recs[id];
	//if (!rec) {
	//    report("Trying pickedObject._wvRec");
	//    var rec = pickedObject._wvRec;
	//}
	if (!rec) {
	    rec = tryToFindRec(pickedObject);
	    if (rec)
		id = rec.id;
	}
	if (!rec) {
	    report("Cannot find rec for id: "+id);
	    PICKED_OBJ = pickedObject;
	    BAD_ID = id;
	    return;
	}
	var layerName = rec.layerName;
	var layer = WV.layers[layerName];
        report("click picked..... pickedObject._id "+id+ " layer: "+layerName);
        var rec = layer.recs[id];
	if (rec.clickHandler) {
	    report("*** calling rec.clickHandler");
	    rec.clickHandler(e, rec, e.position, pickPos);
	}
	else {
	    report("*** no click handler");
	    WV.Robots.handleClick(e, rec, e.position, pickPos);
	}
	//if (layer.clickHandler)
	//    layer.clickHandler(rec, e.position, pickPos);
        //WV.playVid(rec);
        //WV.viewer.trackedEntity = undefined;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function(e) {
	    report("LEFT_DOUBLE_CLICK e: "+JSON.stringify(e));
	    WV.handleNoteClick(e);
	    //WV.viewer.trackedEntity = undefined;
	    //WV.hideAnimationWidget();
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

}

WV.playVidInPopup = function(rec)
{
    var youtubeId = rec.youtubeId;
    var url = "https://www.youtube.com/watch?v="+youtubeId;
    window.open(url, "DroneVidioView");
    //setTimeout(function() {
    //}, 400);
}

WV.playVidInIFrame = function(rec)
{
    var youtubeId = rec.youtubeId;
    WVYT.playVideo(youtubeId, rec);
    /*
    var url = "https://www.youtube.com/watch?v="+youtubeId;
    setTimeout(function() {
        window.open(url, "DroneVidioView");
    }, 400);
    */
}

WV.playVid = function(rec)
{
    setTimeout(function() {
	if (!rec.youtubeId) {
	   WV.showPage(rec);
	   return;
	}
	if (WV.playVideoInIframe)
	    WV.playVidInIFrame(rec);
	else
	    WV.playVidInPopup(rec);
	}, 200);
}

WV.showPage = function(rec)
{
    report("show page: "+JSON.stringify(rec));
    setTimeout(function() {
	    if (WV.showPagesInIframe) {
		WV.pageWidget.show();
		WV.pageWidget.setSrc(rec.url);
	    }
	    else {
		window.open(rec.url, "HTMLPages");
	    }
    }, 300);
}

WV.handleNoteClick = function(e)
{
    report("handleClick e: "+JSON.stringify(e));
    var cartesian = WV.viewer.camera.pickEllipsoid(e.position, WV.scene.globe.ellipsoid);
    if (cartesian) {
	var gpos = Cesium.Cartographic.fromCartesian(cartesian);
	var lon = Cesium.Math.toDegrees(gpos.longitude);
	var lat = Cesium.Math.toDegrees(gpos.latitude);
	report("picked: "+lon+" "+lat);
	WV.Note.initNote(lon, lat);
	WV.Note.setVisibility(true);
	//WV.Note.sendNote(lon, lat, "This is a note made at "+new Date());
    }
    else {
	report("no intersect...");
    }
}

WV.simplePickHandler = function(rec)
{
    report("picked record: "+JSON.stringify(rec));
}

WV.simpleClickHandler = function(rec)
{
    report("clicked record: "+JSON.stringify(rec));
}

/*
  Use this instead of $.getJSON() because this will give
  an error message in the console if there is a parse error
  in the JSON.
 */
WV.getJSON = function(url, handler)
{
    report(">>>>> getJSON: "+url);
    $.ajax({
        url: url,
	dataType: 'text',
	success: function(str) {
		data = JSON.parse(str);
		handler(data);
	    }
	});
}


WV.getStatusObj = function()
{
    WV.numPolls++;
    var cpos = WV.viewer.camera.positionCartographic;
    var clat = WV.toDegrees(cpos.latitude);
    var clon = WV.toDegrees(cpos.longitude);
    WV.curPos = [clat, clon, cpos.height];
    var t = WV.getClockTime();
    var status = {
	'type': 'people',
	'userId': WV.myId,
	'name': WV.myName,
	'origin': WV.origin,
	'curPos': WV.curPos,
	't': t,
	'n': WV.numPolls};
    return status;
}

WV.reportStatus = function()
{
    //report("reportStatus");
    var status = WV.getStatusObj();
    wvCom.sendStatus(status);
    setTimeout(WV.reportStatus, WV.statusInterval);
}


WV.hideAnimationWidget = function()
{
    if (WV.viewer.animation)
	WV.viewer.animation.destroy();
    if (WV.viewer.timeline)
	WV.viewer.timeline.destroy();
}

WV.createModel = function(entities, opts)
{
    var name = opts.name;
    var url = opts.url;
    var lat = opts.lat;
    var lon = opts.lon;
    var height = opts.height || 0;
    var heading = opts.heading || 0;
    var pitch = opts.pitch || 0;
    var roll = opts.roll || 0;
    var scale = opts.scale || 1.0;
    report("----------- WV.createModel -------------");
    report("WV.createModel "+name+" url: "+url+" lat: "+lat+" lon: "+lon+"  ht: "+height);
    report("     heading: "+heading+" pitch: "+pitch+" roll: "+roll);
    var viewer = WV.viewer;
    //viewer.entities.removeAll();
    var position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading, pitch, roll);

    var entity = entities.add({
        name : url,
        position : position,
        orientation : orientation,
        model : {
            uri : url,
            scale: scale,
	    //            minimumPixelSize : 128,
            minimumPixelSize : 8,
            maximumScale : 20000
        }
    });
    return entity;
    //viewer.trackedEntity = entity;
}

/*
// WV.addModel is now in WV.Billboards and has a different
// signature.
WV.addModel = function(collection, name, url, lat, lon, h)
{
    report("----------- WV.addModel -------------");
    if (!collection)
	collection = WV.viewer.entities;
    e = WV.createModel(collection, name, url, lat, lon, h);
    return e;
}
*/
function testJunk()
{
    report("----------- testJunk -------------");
    var entities = WV.viewer.entities;
    var lon = -123.0744619;
    var lat = 44.0503706;
    WV.addModel(null, "Airplane", '../static/models/CesiumAir/Cesium_Air.glb', lat, lon, 5000.0);
    WV.addModel(null, "Gr",       '../static/models/CesiumGround/Cesium_Ground.glb', lat, lon, 0);
    WV.addModel(null, "Milk",     '../static/models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb', lat, lon, 0);
    e = 
    WV.addModel(null, "Man",  '../static/models/CesiumMan/Cesium_Man.glb', lat, lon, 0);
    WV.viewer.trackedEntity = e;
};

WV.addKML = function(url, opts)
{
    report("addKML "+url.slice(0,50));
    var options = {
	camera : WV.viewer.scene.camera,
	canvas : WV.viewer.scene.canvas
    };
    //WV.viewer.camera.flyHome(5);
    //WV.viewer.dataSources.add(Cesium.KmlDataSource.load('data/kml/Enocks Cross Country Trip.kml', options));
    var ds = WV.viewer.dataSources.add(Cesium.KmlDataSource.load(url, options));
    return ds;
}

WV.addGeoJSON = function(url, opts)
{
    report("addGeoJSON "+url);
    var options = {
	camera : WV.viewer.scene.camera,
	canvas : WV.viewer.scene.canvas
    };
    var ds = WV.viewer.dataSources.add(Cesium.GeoJsonDataSource.load(url, options));
    return ds;
}

WV.addDataSource = function(dataSource)
{
    report("addDataSource "+dataSource);
    WV.viewer.dataSources.add(dataSource);
}

WV.removeDataSource = function(dataSource)
{
    report("removeDataSource "+dataSource);
    var i = WV.viewer.dataSources.indexOf(dataSource);
    report(" dataSource index: "+i);
    WV.viewer.dataSources.remove(dataSource);
}

function testJunk2()
{
    options = {
	camera : WV.viewer.scene.camera,
	canvas : WV.viewer.scene.canvas
    };

    //WV.viewer.dataSources.add(Cesium.KmlDataSource.load('data/kml/gdpPerCapita2008.kmz', options));
    WV.viewer.dataSources.add(Cesium.KmlDataSource.load('data/kml/Enocks Cross Country Trip.kml', options));
}

WV.handleDroppedURL = function(e, url)
{
    report("handling URL: "+url);
    //E = e;
    var pos = e;
    var cartesian = WV.viewer.camera.pickEllipsoid(pos, WV.scene.globe.ellipsoid);
    if (cartesian) {
	var gpos = Cesium.Cartographic.fromCartesian(cartesian);
	var lon = Cesium.Math.toDegrees(gpos.longitude);
	var lat = Cesium.Math.toDegrees(gpos.latitude);
	report("URL dropped at: "+lon+" "+lat);
	var lname = "beyondthefence";
	var rec = {'url': url,
		   'lon': lon, 'lat': lat, 'type': 'html'};
	WV.layers[lname].layerType.dataHandler([rec], lname);
	/*
	WV.Note.initNote(lon, lat, url);
	WV.Note.setVisibility(true);
	*/

    }
    else {
	report("Cannot determine position for URL");
    }
}

WV.handleDroppedFile = function(e, file)
{
    report("handling File: "+file.name+" "+file.type);
    //E = e;
    var pos = e;
    var cartesian = WV.viewer.camera.pickEllipsoid(pos, WV.scene.globe.ellipsoid);
    if (cartesian) {
	var gpos = Cesium.Cartographic.fromCartesian(cartesian);
	var lon = Cesium.Math.toDegrees(gpos.longitude);
	var lat = Cesium.Math.toDegrees(gpos.latitude);
	report("File dropped at: "+lon+" "+lat);
	var reader = new FileReader();
	if (file.name.indexOf("kml") > 0) {
	    reader.onload = function(e) {
		var dataURL = reader.result;
		//report("gotDataURL "+dataURL);
		ds = WV.addKML(dataURL);
		ds.then(function(ent) {
			report("loaded ds ent: "+ent);
			WV.viewer.flyTo(ent, {duration: 10});
		    });
	    }
	    reader.readAsDataURL(file);
	}
	else if (file.name.indexOf(".json") > 0) {
	    reader.onload = function(e) {
		var text = reader.result;
		report("dropped JSON: "+text);
		obj = JSON.parse(text);
		report("obj: "+obj);
		WV.handleDroppedJSON(file.name, obj);
	    }
	    reader.readAsText(file);
	}
	else {
		report("Unrecognized file "+file.name);
	}
	//WV.Note.initNote(lon, lat, url);
	//WV.Note.setVisibility(true);
    }
    else {
	report("Cannot determine position for Dropped File");
    }
}

WV.handleDroppedJSON = function(fname, obj)
{
    report("got dropped file "+fname);
    report("obj: "+WV.toJSON(obj));
    if (obj.type == "Layer") {
	var name = obj.name;
	var layer = WV.layers[name];
	layer.handleLocalData(obj);
    }
}

$(document).ready(function() {
    report("Starting...");
    wvCom = new WV.WVCom();
    var layersName = WV.getParameterByName("layers", document.location.search);
    var userName = WV.getParameterByName("user", document.location.search);
    report("*********************** userName: "+userName);
    if (userName) {
	WV.myName = userName;
    }
    if (layersName) {
	WV.layersUrl = "data/"+layersName+".json";
    }
    WV.getLayers();
    WV.setupCesium();
    WV.getLocation();
    setTimeout(WV.reportStatus, WV.statusInterval);
    WV.DnD.setup(WV.handleDroppedURL, WV.handleDroppedFile);
    //testJunk();
    //testJunk2();
});
