/*

TODO: Cleanup namespace usage... move most things to IndoorMaps unless
higher scope is appropriate.
 */
WV.IndoorMaps = {};

WV.geo = function(lon, lat)
{
    return new Cesium.Cartographic(lon, lat, 0);
}

WV.IndoorMaps.addModel = function()
{
   var position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 10);
   var heading = Cesium.Math.toRadians(135);
   var pitch = 0;
   var roll = 0;
   var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading, pitch, roll);
   var url = "fxpalRot.png";

   var entity = WV.viewer.entities.add({
        name : url,
        position : position,
        orientation : orientation,
        model : {
            uri : url,
            minimumPixelSize : 128,
            maximumScale : 20000
        }
    });
   return entity;
}
 
WV.drawImage = function(image, lon0, lat0, wid, len, height, rot) {
	report("------------- drawImage --------------");
	report("lon0: "+lon0+"  lat0: "+lat0+" wid: "+wid+" len: "+len+" h: "+height+" rot: "+rot);
	var entity      = new Cesium.Entity();
	var dp = 0.0001;
	var g = new Cesium.EllipsoidGeodesic(WV.geo(lon0,lat0), WV.geo(lon0+dp,lat0));
	var dlonPerDs = dp/g.surfaceDistance;
	var g = new Cesium.EllipsoidGeodesic(WV.geo(lon0,lat0), WV.geo(lon0,lat0+dp));
	var dlatPerDs = dp/g.surfaceDistance;
	report("dlonPerDs: "+dlonPerDs+"     dlatPerDs: "+dlatPerDs);
	var dlon = wid * dlonPerDs;
	var dlat = len * dlatPerDs;
	var lon1 = lon0 + dlon;
	var lat1 = lat0 + dlat;
	report("lon0: "+lon0+"  lat0: "+lat0+"  lon1: "+lon1+" lat1: "+lat1);
	var rect = Cesium.Rectangle.fromDegrees(lon0, lat0, lon1, lat1);
	//var rect = Cesium.Rectangle.fromDegrees(lon0, lat1, lon1, lat0);
	entity.rectangle = new Cesium.RectangleGraphics(
		{
		    coordinates: rect,
		    material: new Cesium.ImageMaterialProperty( {
			    transparent: true,
			    image: image
			} ),
		    //rotation: rot,
		    //stRotation: rot,
		    height: height
                }
	);
        WV.viewer.entities.add(entity);
	//return entity;
	return entity.rectangle;
};

//WV.addImageLayer = function(imageUrl, latLow, lonLow, latHigh, lonHigh)
WV.addImageLayer = function(imageUrl, lon0, lat0, lon1, lat1)
{
    var imageryLayers = WV.viewer.imageryLayers;
    //var rect = Cesium.Rectangle.fromDegrees(latLow, lonLow, latHigh, lonHigh);
    report("addImageLayer lon0: "+lon0+"  lat0: "+lat0+"  lon1: "+lon1+" lat1: "+lat1);
    var rect = Cesium.Rectangle.fromDegrees(lon0, lat0, lon1, lat1);
    var provider = new Cesium.SingleTileImageryProvider({
	    url : imageUrl,
	    rectangle : rect
	});
    var ilayer = imageryLayers.addImageryProvider(provider);
    ilayer.alpha = 1.0;
    ilayer.show = true;
    return ilayer;
}

function testy()
{
    WV.drawImage("person0.png", -86, 30, 1000, 1000, 10, -0.5);
    WV.drawImage("eye1.png", -120, 50, 300, 300, 10, 0.5);
}


WV.IndoorMaps.handleData = function(data, name)
{
    //WV.IndoorMaps.addModel();
    report("handleIndoorMapData");
    var layer = WV.layers["indoorMaps"];
    layer.showFun = WV.IndoorMaps.getData;
    layer.visible = true;
    if (layer.recs != null) {
	//WV.setIndoorMapsVisibility(true);
	//return;
    }
    if (layer.recs == null) {
	layer.recs = {};
	layer.billboards = {};
	layer.ilayers = {};
	//layer.showFun = WV.showIndoorMaps;
	layer.hideFun = WV.hideIndoorMaps;
	layer.bbCollection = new Cesium.BillboardCollection();
    }
    var recs = data;
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	var rtype = rec.type;
	var id = rec.id;
	if (layer.ilayers[id]) {
	    report("************* Hiding map we already have...");
	    layer.ilayers[id].show = false;
	}
	if (rtype.toLowerCase() == "geojson") {
	    var url = rec.url;
	    var obj = WV.viewer.dataSources.add(Cesium.GeoJsonDataSource.load(url, {
			stroke: Cesium.Color.HOTPINK,
			//fill: Cesium.Color.PINK.withAlpha(0.5),
			    fill: Cesium.Color.PINK.withAlpha(0.0),
			    strokeWidth: 3
	    }));
	    xobj = obj;
	    //rec.ilayers[id] = obj;
	    report("obj: "+obj);
	    continue;
	}
	if (rtype == "image") {
	    var lon = rec.lon;
	    var lat = rec.lat;
	    var h = 10;
	    if (rec.height != null)
		h = rec.height;
	    var rot = 0;
	    if (rec.rot) {
		rot = toRadians(rec.rot);
	    }
	    layer.recs[id] = rec;
	    var width = rec.width;
	    var len = rec.length;
	    report("len: "+len+" width: "+width+"  rot: "+rot);
	    ilayer = WV.drawImage(rec.url,   lon, lat, width, len, h, rot);
	    ilayer.name = name;
	    layer.ilayers[id] = ilayer;
	    continue;
	}
	if (rtype.toLowerCase() == "imagelayer") {
	    var lon = rec.lonRange[0];
	    var lonHigh = rec.lonRange[1];
	    var lat = rec.latRange[0];
	    var latHigh = rec.latRange[1];
	    layer.recs[id] = rec;
	    ilayer = WV.addImageLayer(rec.url, lon, lat, lonHigh, latHigh);
	    ilayer.name = name;
	    layer.ilayers[id] = ilayer;
	    continue;
	}
	report("**** unknown rtype: "+rtype);
    }
}

/*
WV.showIndoorMaps = function()
{
    WV.setIndoorMapsVisibility(true);
}

WV.hideIndoorMaps = function()
{
    WV.setIndoorMapsVisibility(false);
}
*/

WV.IndoorMaps.setVisibility = function(v)
{
    var layer = WV.layers["indoorMaps"];
    WV.setObjsAttr(layer.ilayers, "show", v);
    //if (v)
    //	setObjsAttr(layer.ilayers, "alpha", 1);
    //else
    //  setObjsAttr(layer.ilayers, "alpha", 0.2);
}


$(document).ready(function()
{
    WV.registerLayerType("indoorMaps", {
         dataHandler: WV.IndoorMaps.handleData,
         setVisibility: WV.IndoorMaps.setVisibility,
	     });

});

