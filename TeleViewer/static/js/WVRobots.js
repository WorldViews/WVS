
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

WV.registerModule("WVRobots.js");

WV.registerRecHandler("robot", WV.Robots.addRobot);

WV.registerLayerType("robots", {
	moveHandler: WV.Trails.moveHandler
});

