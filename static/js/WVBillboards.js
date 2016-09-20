/*
This module has code for creating billboards and tethers.
Tethers are lines drawn from billboards to points on the ground.
 */

WV.setBillboardsVisibility = function(objs, val, tval)
{
    if (tval == null)
	tval = val;
    //report("WV.setBillboardsVisiblity val: "+val+" tval: "+tval+"  objs: "+objs);
    for (id in objs) {
	//report("set objs["+id+"]."+attr+" = "+val);
	objs[id].show = val;
	if (objs[id].tether) {
	    objs[id].tether.show = tval;
	    //report("set tether "+id+" "+tval);
	}
	if (objs[id].anchor) {
	    objs[id].anchor.show = val;
	    //report("set anchor "+id+" "+val);
	}
    }
}


WV.setObjsAttr = function(objs, attr, val)
{
    report("setObjsAttr "+attr+" "+val+" objs: "+objs);
    for (id in objs) {
	//report("set objs["+id+"]."+attr+" = "+val);
	objs[id][attr] = val;
	if (objs[id].tether)
	    objs[id].tether[attr] = val;
	if (objs[id].anchor)
	    objs[id].anchor[attr] = val;
    }
}


WV.tetherPolylines = null;

WV.getTetherPolylines = function()
{
    WV.tetherPolylines = WV.entities;
    return WV.tetherPolylines;
}

WV.getTetherPoints = function(lat, lon, h0, h1)
{
    //report("lat,lon 0: "+lat+" "+lon+" h0: "+h0+"   h1: "+h1);
    var positions = [Cesium.Cartesian3.fromDegrees(lon, lat, h0),
		     Cesium.Cartesian3.fromDegrees(lon, lat, h1)];
    return positions;
}

WV.getTetherPoints2 = function(lat0, lon0, h0, lat1, lon1, h1)
{
    //report("lat,lon 0: "+lat0+" "+lon0+" "+h0);
    //report("lat,lon 1: "+lat1+" "+lon1+" "+h1);
    var positions = [Cesium.Cartesian3.fromDegrees(lon0, lat0, 0),
		     Cesium.Cartesian3.fromDegrees(lon1, lat1, h1),
		     Cesium.Cartesian3.fromDegrees(lon1, lat1, 0)];
    return positions;
}

WV.getTether = function(tetherId, points)
{
    //report("WV.getTether id: "+tetherId+" "+JSON.stringify(points));
    var material = new Cesium.PolylineGlowMaterialProperty({
	    color : Cesium.Color.RED,
	    glowPower : 0.15});
    var opts = { positions : points,
		 id: tetherId,
		 width : 3.0,
		 material : material };
    var tether = null;
    var polylines = WV.getTetherPolylines();
    tether = polylines.add({polyline: opts});
    tether = tether.polyline;
    return tether;
}

WV.defaultAnchorURL = "/images/mona_cat.jpg";

WV.addBillboard0 = function(bbCollection, id, lat, lon, imgUrl, scale, height)
{
    //report("Adding billboard "+WV.numBillboards);
    // Example 1:  Add a billboard, specifying all the default values.
    var b = bbCollection.add({
       show : true,
       position : Cesium.Cartesian3.fromDegrees(lon, lat, height),
       pixelOffset : Cesium.Cartesian2.ZERO,
       eyeOffset : Cesium.Cartesian3.ZERO,
       horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
       verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
       scale : scale,
       image : imgUrl,
       color : Cesium.Color.WHITE,
       id : id
    });
    return b;
}


WV.addBillboard = function(bbCollection, lat, lon, imgUrl, id, scale, height,
			   useTether, useAnchor)
{
    WV.numBillboards++;
    //report("Adding billboard "+WV.numBillboards);
    // Example 1:  Add a billboard, specifying all the default values.
    if (!imgUrl)
	imgUrl = WV.defaultBillboardIconURL;
    if (!scale)
       scale = WV.bbScaleUnselected;
    if (!height)
       height = 100000;
    var b = bbCollection.add({
       show : true,
       position : Cesium.Cartesian3.fromDegrees(lon, lat, height),
       pixelOffset : Cesium.Cartesian2.ZERO,
       eyeOffset : Cesium.Cartesian3.ZERO,
       horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
       verticalOrigin : Cesium.VerticalOrigin.CENTER,
       scale : scale,
       image : imgUrl,
       color : Cesium.Color.WHITE,
       id : id
    });
    b.unselectedScale = scale;
    b.tether = null;
    b.trueLat = lat;
    b.trueLon = lon;
    b.neighbors = null;
    var alwaysAddTether = true;
    if (alwaysAddTether || useTether) {
	var tetherId = "tether_"+id;
	//report("adding tether "+tetherId);
	var points = WV.getTetherPoints(lat, lon, 0, height);
	var tether = WV.getTether(tetherId, points);
	b.tether = tether;
	tether.show = useTether;
	//layer.tethers[id] = tether;
    }
    var alwaysAddAnchor = true;
    if (alwaysAddAnchor || useAnchor) {
	var anchorId = "anchor_icon_"+id;
	//report("creating anchor "+anchorId+" scale "+scale);
	//var imgUrl = WV.defaultAnchorIconURL;
	var ab = WV.addBillboard0(bbCollection, anchorId,
				  lat, lon, 
				  imgUrl,
				  1.0, 10);
	b.anchor = ab;
	//ab.pixelOffset = new Cesium.Cartesian2(0.0, 1.0);
	//ab.pixelOffsetScaleByDistance = new Cesium.NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0);
        //ab.scaleByDistance = new Cesium.NearFarScalar(1.0e2, 1.0, 800000, 0.0);
        ab.scaleByDistance = new Cesium.NearFarScalar(1000, scale, 800000, 0.0);
    }
    return b;
}

WV.updateBillboard = function(billboard, lat, lon, h)
{
    var b = billboard;
    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h);
    b.position = pos;
    b.show = true;
    if (b.tether) {
	var points = WV.getTetherPoints(lat, lon, 0, h);
	b.tether.positions = points;
	b.tether.show = true;
    }
    if (b.anchor) {
	var pos = Cesium.Cartesian3.fromDegrees(lon, lat, 1);
	b.anchor.position = pos;
    }
}

WV.replace = function(str, a, b)
{
    //TODO: setup regexp way to do this right
    for (var i=0; i<5; i++) {
	str = str.replace(a,b);
    }
    return str;
}

//http://stackoverflow.com/questions/24869733/how-to-draw-custom-dynamic-billboards-in-cesium-js
//WV.addSVGBillboard = function(text, lon, lat, h, size, color, entities)
WV.addSVGBillboard = function(lon, lat, id, opts, entities)
{
    if (!opts)
	opts = {'h': 1000000, 'width': 100, 'height': 100, 'color': 'yellow'};
    // create the svg image string
    var text = opts.text;
    var h = opts.h;
    var color = opts.color;
    var width = opts.width;
    var height = opts.height;
    var entities = opts.entities;
    if (opts.size) {
	width = opts.size;
	height = opts.size;
    }
    var cx = Math.floor(width/2);
    var cy = Math.floor(height/2);
    var r = Math.floor(0.45*width);
    var svgDataDeclare = "data:image/svg+xml,";
    var svgPrefix = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="|WIDTH|px" height="|HEIGHT|px" xml:space="preserve">\n';
    var svgSuffix = "</svg>\n";
    var svgCircle = '<circle cx="|CX|" cy="|CY|" r="|R|" stroke="black" stroke-width="1" fill="|COLOR|" />\n';
    var svgRect = '<rect x="|RX|" y="|RY|" width="|RW|" height="|RH|" stroke="black" stroke-width="1" fill="|COLOR|" />\n';
    //var svgImage = '<image xlink:href="https://i.ytimg.com/vi/bt3nmb_wisE/default.jpg" x="0" y="0" height="100" width="100" />\n';
    var svgImage = '<image xlink:href="http://localhost/Viewer/images/kite2.png" x="0" y="0" height="200" width="200" />\n';
    //var svgText   = '<text x="|TX|" y="|TY|">|TEXT|</text>\n ';
    var svgTextStart = '<g transform="translate(0,0)"><text x="|TX|" y="|TY|" style="font-size:12px">\n ';
    //var svgTArea    = ' <textArea x="4" y="10" width="90px" height="80px">What goes\nhere???</textArea>\n';
    var svgTspan1    = ' <tspan x="4px" y="12px">Note</tspan>\n';
    var svgTspan2    = ' <tspan x="4px" dy="1em">...</tspan>\n';
    var svgTextEnd   = '</text></g>\n ';
    var svgText = svgTextStart+svgTspan1+svgTspan2+svgTextEnd;
    var svgString = svgPrefix +
    //              svgCircle +
                    svgRect   + 
                    svgText   +
    //              svgImage  + 
                    svgSuffix;
    svgString = WV.replace(svgString, "|RX|", ""+0);
    svgString = WV.replace(svgString, "|RY|", ""+0);
    svgString = WV.replace(svgString, "|RW|", ""+(width-1));
    svgString = WV.replace(svgString, "|RH|", ""+height);
    svgString = WV.replace(svgString, "|CX|", ""+cx);
    svgString = WV.replace(svgString, "|CY|", ""+cy);
    svgString = WV.replace(svgString, "|R|", ""+r);
    svgString = WV.replace(svgString, "|TX|", ""+0);
    svgString = WV.replace(svgString, "|TY|", ""+cy);
    svgString = WV.replace(svgString, "|WIDTH|", width);
    svgString = WV.replace(svgString, "|HEIGHT|", height);
    svgString = WV.replace(svgString, "|TEXT|", text);
    svgString = WV.replace(svgString, "|COLOR|", color);
   
   // create the cesium entity
   var svgEntityImage = svgDataDeclare + svgString;
   report("svgString:\n"+svgString);
   var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h);
   report(" pos: "+JSON.stringify(pos));
   if (!entities)
       entities = WV.viewer.entities;
   var b = WV.viewer.entities.add({
	   position: pos,
	   id: id,
           billboard: { image: svgEntityImage }
     });
   // test the image in a dialog
   /*
   $("#dialog").html(svgString );
   $("#dialog").dialog({
                 position: {my: "left top", at: "left bottom"}
       });
   */
   return b;
}

/*
xlines = null;

function drawPoly(lt0, ln0, lt1,ln1)
{
    report(">>>> drawLine "+lt0+" "+ln0+" <--> "+lt1+" "+ln1);
    //   points = [Cesium.Cartesian3.fromDegrees(45, -100, 1000),
    //      Cesium.Cartesian3.fromDegrees(46, -170, 1000)]
    var points = [Cesium.Cartesian3.fromDegrees(ln0, lt0, 1000),
		  Cesium.Cartesian3.fromDegrees(ln1, lt1, 1000000)];

    var col = xlines;
    //    var polyLine = WV.entities.add({
    var polyLine = col.add({
	    polyline : {
		positions : points,
		width : 3.0,
		material : new Cesium.PolylineGlowMaterialProperty({
			//color : Cesium.Color.DEEPSKYBLUE,
			color : Cesium.Color.GREEN,
			glowPower : 0.15
		    })
	    }
	});
    xp = polyLine;
    return polyLine;
    
}

drawLine = drawPoly;
function drawLines()
{
    drawLine(0, 0, 80, 0);
    drawLine(45,-100, 45, -160);
    drawLine(55, 30, 55, 80);
}

function tests()
{
    xlines = WV.entities;
    //xlines = new Cesium.PolylineCollection();
    //WV.entities.add(xlines);
    drawLines();
}
*/

WV.addModel = function(layer, rec)
{
    var id = rec.id;
    if (!id)
	id = WV.getUniqueId("model");
    report(">>>>> addModel "+id);
    var opts = {
	name: rec.name,
	id: id,
	url: rec.modelUrl,
	lat: rec.lat,
	lon: rec.lon,
	height: rec.height,
	scale: rec.scale
    };
    WV.recs[id] = rec;
    if (rec.heading != null)
	opts.heading = WV.toRadians(rec.heading - 90);
    if (rec.pitch != null)
	opts.pitch = WV.toRadians(rec.pitch);
    if (rec.roll != null)
	opts.roll = WV.toRadians(rec.roll);
    var e = WV.createModel(WV.viewer.entities, opts);
    e._wvRec = rec;
    LAST_MODEL = e;
    if (rec.flyTo) {
	//WV.viewer.trackedEntity = e;
	var dur = rec.flyTo;
	report("flyTo dur: "+dur);
	WV.viewer.flyTo(e, {duration: dur});
    }
    layer.models.push(e)
}

