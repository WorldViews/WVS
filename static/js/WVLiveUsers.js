
WV.LiveUsers = {};

WV.LiveUsers.shownUserTimeout = 10; // How recently a user must have
                                    // posted to be shown here
WV.LiveUsers.showOriginBillboards = false;

WV.LiveUsers.initLayer = function(layer)
{
    report("================================================");
    report("initing LiveUsers layer");
    layer.recs = {};
    //layer.tethers = {};
    layer.originBillboards = {};
    layer.curPosBillboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
}

WV.LiveUsers.handleData = function(data, name)
{
    //report("handlePeopleData");
    var layer = WV.layers["people"];
    if (!layer.visible) {
	return;
    }
    //WV.LiveUsers.setVisibility(true);
    var originImageUrl = "person0.png";
    //var curPosImageUrl = "eagle1.png";
    var curPosImageUrl = "/static/img/eye3.png";
    var recs = data;
    var t = WV.getClockTime();
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	if (rec.userId == WV.myId) {
	    //report("******** SKIPPING MY OWN RECORD *********");
	    continue;
	}
        //report("rec "+i+" "+JSON.stringify(rec));
        layer.numObjs++;
	if (rec.origin == null) {
	    report("no origin");
	    continue;
	}
	if (rec.curPos == null) {
	    report("no curPos");
	    continue;
	}
	var dt = t - rec.t;
	if (dt > WV.LiveUsers.shownUserTimeout) {
	    report("ignoring view that is too old...");
	    continue;
	}
	if (rec.userId == "person0") {
	    //report("******** skipping person0 ********");
	    continue;
	}
        var lat0 =   rec.origin[0];
        var lon0 =   rec.origin[1];
	var height0 = 30000;
        var lat =    rec.curPos[0];
        var lon =    rec.curPos[1];
	var height = rec.curPos[2];
        var id = "person_"+rec.userId;
	var h1 = 0.1*height;
        //var id = "person_"+layer.numObjs;
	rec.layerName = "people";
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	var originScale = 0.12;
	var curPosScale = 0.1;
	//var height = 300000;
	var ob = layer.originBillboards[id];
	var points;
	var haveOrigin = false;
	if (lat0 || lon0) {
	    haveOrigin = true;
	    points = WV.getTetherPoints2(lat0, lon0, height0, lat, lon, h1);
	}
	else {
	    points = WV.getTetherPoints(lat, lon, height0, h1);
	}
	if (ob == null && WV.LiveUsers.showOriginBillboards && haveOrigin) {
	    var h0 = 100000;
	    ob = WV.addBillboard(layer.bbCollection, lat0, lon0,
				 originImageUrl, id, originScale,
				 h0, false);
	    layer.originBillboards[id] = ob;
	}
	var cb = layer.curPosBillboards[id];
	if (cb == null) {
	    //report("Create billboard "+id+" "+lat+" "+lon);
	    cb = WV.addBillboard(layer.bbCollection, lat, lon,
				 curPosImageUrl, id, curPosScale, h1, false);
	    layer.curPosBillboards[id] = cb;
	    var tetherId = "tether_"+rec.userId;
	    var tether = WV.getTether(tetherId, points);
	    cb.tether = tether;
	    //cb.tether._prevPoints = null; //
	    //layer.tethers[id] = tether;
	}
	else {
	    //report("billboard exists "+id);
	    var pos = Cesium.Cartesian3.fromDegrees(lon, lat, h1);
	    /*
	    layer.curPosBillboards[id].position = pos;
	    layer.curPosBillboards[id].show = true;
	    var tether = layer.tethers[id];
	    if (tether)
		tether.positions = points;
	    */
	    cb = layer.curPosBillboards[id];
	    cb.position = pos;
	    cb.show = true;
	    if (cb.tether) {
		//
		cb.tether.positions = points;
		// Doing this instead of the assignment in previous
		// line was attempt to stop flickering, but doesn't help
		/*
		if (!WV.eqPoints(cb.tether._prevPoints, points)) {
		    //report("***** updating...");
		    cb.tether.positions = points;
		    cb.tether._prevPoints = points;
		}
		else {
		    // report("***** skipping no change...");
		}
		*/
	    }
	}
    }
    WV.LiveUsers.pruneOld(layer);
}

WV.LiveUsers.pruneOld = function(layer)
{
    //report("WV.LiveUsers.pruneOld");
    var t = WV.getClockTime();
    for (var id in layer.recs) {
	var rec = layer.recs[id];
	var dt = t - rec.t;
	//report("dt: "+dt);
	if (dt < WV.LiveUsers.shownUserTimeout) {
	    continue;
	}
	//TODO: Should actually delete these, not just hide them
	var b = layer.curPosBillboards[id];
	b.show = false;
	if (b.tether)
	    b.tether.show = false;
    }
}

/*
  This is different from default setVisibility for layers because
  instead of having layer.billboards, we have layer.curPosBillboards.
  This could probably be eliminated if we have something like a list
  billboard container objects for each layer.
*/
WV.LiveUsers.setVisibility = function(v)
{
    report("WV.LiveUsers.setVisiblity "+v);
    var layer = WV.layers["people"];
    layer.visible = v;
    WV.setBillboardsVisibility(layer.curPosBillboards, v);
}


WV.LiveUsers.handleClick = function(rec)
{
    report("LiveUsers.handleClick "+JSON.stringify(rec));
    var id = rec.id;
    report("id: "+id);
}

$(document).ready(function()
{
    WV.registerLayerType("people", {
         initFun:       WV.LiveUsers.initLayer,
         dataHandler:   WV.LiveUsers.handleData,
         clickHandler:  WV.LiveUsers.handleClick,
         setVisibility: WV.LiveUsers.setVisibility
    });
});

