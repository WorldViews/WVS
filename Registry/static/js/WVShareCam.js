
WV.ShareCam = {};

WV.ShareCam.dist2 = function(a,b)
{
    //report("dist2 a: "+a+"   b: "+b);
    var dlat = a.trueLat-b.trueLat;
    var dlon = a.trueLon-b.trueLon;
    var d2 = dlat*dlat + dlon*dlon;
    //report("d: "+d2);
    return d2;
}

WV.ShareCam.dist = function(a,b)
{
    //report("dist2 a: "+a+"   b: "+b);
    var dlat = a.trueLat-b.trueLat;
    var dlon = a.trueLon-b.trueLon;
    var d2 = dlat*dlat + dlon*dlon;
    //report("d: "+d2);
    return Math.sqrt(d2);
}

WV.ShareCam.initLayer = function(layer)
{
    report("layer: "+WV.toJSON(layer));
    report("initing PeopleData layer");
    layer.recs = {};
    layer.billboards = {};
    layer.picbillboards = {};
    layer.kdTree = null;
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    layer.showFun = function() {
	if (!WV.ShareCam.keepPolling) {
	    WV.ShareCam.keepPolling = true;
	    WV.ShareCam.watchForPics(layer);
	}
    }
}

WV.ShareCam.handleData = function(data, layerName)
{
    report("handleShareCamData");
    var layer = WV.layers["sharecam"];
    if (!WV.ShareCam.keepPolling) {
	WV.ShareCam.keepPolling = true;
	WV.ShareCam.watchForPics();
    }
    if (!layer.visible) {
	return;
    }
    //WV.setPeopleVisibility(true);
    //    WV.setTethersVisibility(true);
    //    WV.setPeopleBillboardsVisibility(true);
    /*
    if (layer.recs == null) {
	report("initing PeopleData layer");
	layer.recs = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    */
    //var curPosImageUrl = "eagle1.png";
    var iconUrl = layer.iconUrl;
    if (!iconUrl)
	iconUrl = "jumpChat.png";
    report("data: "+JSON.stringify(data));
    //var recs = WV.getRecords(data);
    var recs = data;
    var t = WV.getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("***************** rec: "+JSON.stringify(rec));
        layer.numObjs++;
	var dt = t - rec.t;
	if (dt > WV.shownUserTimeout) {
	    report("ignoring view that is too old...");
	    continue;
	}
        var lat =   rec.lat;
        var lon =   rec.lon;
	var scale = 0.1;
	var height = 300000;
        var id = "sharecam_"+rec.sessionId;
	rec.layerName = layerName;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var b = layer.billboards[id];
	if (b == null) {
	    var ob = WV.addBillboard(layer.bbCollection, lat, lon,
				    iconUrl, id, scale, height);
	    layer.billboards[id] = ob;
	}
	else {
	    report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	    layer.billboards[id].position = pos;
	}
    }
    /*
    for (var id in layer.recs) {
	var rec = layer.recs[id];
	var dt = t - rec.t;
	report("dt: "+dt);
	if (dt < WV.shownUserTimeout) {
	    report("skipping new views...");
	    continue;
	}
	//TODO: Should actually delete these, not just hide them
	layer.billboards[id].show = false;
    }
    */
}

/*
WV.ShareCam.handleClick = function(rec)
{
    report("ShareCam.handleClick "+JSON.stringify(rec));
    var room = rec.room;
    if (room == null || room == "null") {
	report("No room.... nothing to do");
	return;
    }
    var url = "https://jumpchat.paldeploy.com/sharedcam/?room="+room;
    report("ShareCam.JumpChat url: "+url);
    setTimeout(function() {
		window.open(url, "JumpChat");
	}, 200);
}
*/
WV.ShareCam.handleClick = function(rec)
{
    report("ShareCam.handleClick "+JSON.stringify(rec));
    var room = rec.room;
    if (room) {
	var url = "https://jumpchat.paldeploy.com/sharedcam/?room="+room;
	report("ShareCam.JumpChat url: "+url);
	setTimeout(function() {
		window.open(url, "JumpChat");
	    }, 200);
    }
    else {
	var hash = rec.hash;
	if (!hash) {
	    report("No hash and no room... skipping this");
	    return;
	}
	url = "https://sharedcam.paldeploy.com/photo/"+hash;
	//WV.showPage({'url': url});
	setTimeout(function() {
		window.open(url, "Photos");
	    }, 200);
	return;
    }
}

/******************************************************************
 This stuff below was added as a hack, and doesn't follow the same
 overal event notification scheme as the other stuff.  It has the
 client poll for new pictures.
 ******************************************************************/

WV.ShareCam.newest_photo_hash = "";
WV.ShareCam.hashes = {};
WV.ShareCam.keepPolling = false;

WV.ShareCam.watchForPics = function(layer)
{
    report("WV.ShareCam.watchForPics...");
    //var layer = WV.layers["sharecam"];
    var fetchRecentUrl = "https://sharedcam.paldeploy.com/recent/" +
                               WV.ShareCam.newest_photo_hash + "?json=true";
    WV.getJSON( fetchRecentUrl, function(data) {
	    try{ 
		WV.ShareCam.handleShareCamData(data, layer);
	    }
	    catch (err) {
		report("error: "+err);
	    }
	    if (WV.ShareCam.keepPolling)
		setTimeout(function() {
			WV.ShareCam.watchForPics(layer)}, 4000);
    });
}


WV.ShareCam.handleShareCamData = function( objs, layer ) {
      var layerName = layer.name;
      report("WV.ShareCam.handleShareCamData "+layerName);
      //report("num objs "+objs.length);
      var t0 = WV.getClockTime();
      var numNew = 0;
      for(var i=0; i<objs.length; i++) {
          var obj = objs[i];
          var hash = obj.hash;
          if (WV.ShareCam.hashes[hash])
              continue;
          WV.ShareCam.hashes[hash] = obj;
          var metadata = obj.metadata;
          //report("metadata: "+metadata);
          try {
              metadata = JSON.parse(metadata);
          }
          catch (e) {
	     report("error for obj "+i+" hash: "+hash);
             continue;
          }
          var lat = metadata.latitude;
          var lon = metadata.longitude;
          //report("obj "+i+": "+JSON.stringify(obj));
	  var dateUploadedStr = obj.date_uploaded;
	  //report("dateUploadedStr: "+dateUploadedStr);
	  var t = new Date(dateUploadedStr).getTime()/1000.0;
	  //report("t: "+t);
	  var age = t0 - t;
	  var ageInMinutes = age/60;
	  var ageInDays = age/(24*60*60);
	  //report("ageInDays: "+ageInDays);
	  if (ageInMinutes > 90) {
	      report("Picture too old... skipping...");
	      continue;
	  }
	  if (ageInDays > 600) {
	      report("Picture too old... skipping...");
	      continue;
	  }
          //report("meta: " + JSON.stringify(metadata));
          //report("latLon: "+lat+" "+lon);
          if (!lat || !lon)
             continue;
	  lat = eval(lat) + 0.000001*(Math.random() - 0.5);
	  lon = eval(lon) + 0.000001*(Math.random() - 0.5);
	  rec = obj;
	  rec.t = t0;
	  rec.layerName = layerName;
          report("obj "+i+" lat: "+lat+" lon: "+lon+" hash: "+hash);
          var imgUrl = "https://sharedcam.paldeploy.com/thumb/" + hash;
          report("imgUrl "+imgUrl);
	  var id = "scp_"+hash;
	  layer.recs[id] = rec;
	  WV.recs[id] = rec;
	  scale = .2;
	  height = 50000;
	  var b = layer.picbillboards[id];
	  if (b == null) {
	      var ob = WV.addBillboard(layer.bbCollection, lat, lon,
				       imgUrl, id, scale, height);
	      layer.picbillboards[id] = ob;
	      numNew += 1;
	  }
	  else {
	      report("billboard exists "+id);
	      var pos = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	      layer.picbillboards[id].position = pos;
	  }
      }
      if (numNew > 0) {
	  WV.ShareCam.adjustPositions(layer, layer.picbillboards);
      }
      //console.log( "Load was performed. New max content id", WV.ShareCam.newest_photo_hash );
}

var APO = null;

WV.ShareCam.adjustPositions = function(layer, bbsDict)
{
    report("================================================================");
    report("Setting neighbors:");
    var t0 = WV.getClockTime();
    var bbs = [];
    for (var id in bbsDict) {
	    bbs.push(bbsDict[id]);
    }
    report("creating kdTree");
    layer.kdTree = new kdTree(bbs, WV.ShareCam.dist, ["trueLat", "trueLon"]);
    var t1 = WV.getClockTime();
    report("got tree in "+(t1-t0)+" secs.");
    for (var i=0; i<bbs.length; i++) {
	var bb = bbs[i];
	var neighbors = layer.kdTree.nearest(bb, 20, 0.01);
	//report("  num neighbors: "+neighbors.length);
	bb.neighbors = neighbors;
    }
    var t2 = WV.getClockTime();
    report("found neighbors for "+bbs.length+" recs in "+(t2-t1)+" secs.");
    var numAdjusts = 5;
    for (var k=0; k<numAdjusts; k++) {
	WV.ShareCam.adjustPositionsOnce(bbs);
	var t3 = WV.getClockTime();
	report("adjustedPositions in "+(t3-t2)+" secs.");
	t2 = t3;
    }
    var t4 = WV.getClockTime();
    report("total processing of "+bbs.length+" recs in "+(t4-t1)+" secs.");
    // for debugging...
    BBS = bbs;
    APO = function() {
	WV.ShareCam.adjustPositionsOnce(bbs);
    };
}

WV.ShareCam.adjustPositionsOnce = function(bbs)
{
    var i;
    for (i=0; i<bbs.length; i++) {
	bbs[i].force = [0,0,0];
    }
    for (i=0; i<bbs.length; i++) {
	var bbi = bbs[i];
	//report("bbi: "+bbi+" "+bbi.position);
	for (var j=0; j<bbi.neighbors.length; j++) {
	    var bbj = bbi.neighbors[j][0];
	    //report("bbi: "+bbi+" "+bbi.position+"   "+JSON.stringify(bbi.position));
	    var d = bbi.neighbors[j][1];
	    var a = 2.0/(d + 0.01);
	    //report("   d: "+d+"    bbj: "+bbj+" "+bbj.position);
	    var dx = bbi.position.x - bbj.position.x;
	    var dy = bbi.position.y - bbj.position.y;
	    var dz = bbi.position.z - bbj.position.z;
	    var Z = Math.sqrt(dx*dx + dy*dy + dz*dz);
	    if (Z == 0) {
		//report("bbi "+i+"  bbj "+j+"  identical");
		continue;
	    }
	    bbi.force[0] = a*dx/Z;
	    bbi.force[1] = a*dy/Z;
	    bbi.force[2] = a*dz/Z;
	    //report("   force: "+bbi.force);
	}
    }
    for (i=0; i<bbs.length; i++) {
	var bbi = bbs[i];
	//report("  "+i+" "+bbi.force);
	bbi.position.x += bbi.force[0];
	bbi.position.y += bbi.force[1];
	bbi.position.z += bbi.force[2];
	if (bbi.tether) {
	    var pos = bbi.tether.positions.getValue();
	    var p1 = Cesium.Cartesian3.fromDegrees(bbi.trueLon, bbi.trueLat, 0);
	    var p2 = Cesium.Cartesian3.fromElements(bbi.position.x, bbi.position.y, bbi.position.z);
	    //report("p1: "+p1+"   p2: "+p2);
	    var positions = [p1, p2]
	    bbi.tether.positions = positions;
	}
    }
}

$(document).ready(function() {
    WV.registerLayerType("sharecam", {
         initFun: WV.ShareCam.initLayer,
         dataHandler: WV.ShareCam.handleData,
         clickHandler: WV.ShareCam.handleClick
	     });
});
