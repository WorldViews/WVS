
WV.coordinateSystems = {};

/*
There are four coordinate systems involved in this code.
It may not be necessary to have separate gxyz and lxyz
systems, but it keeps this code closer to the google API
examples such as monster milk truck.

geo:
  This is latitude, longitude, altitude.
gxyz:
  This is a global cartesian coordinate system.
lxyz:
  This is a 'local' cartesian coordinate system around
  some anchorpoint (such as the position of the origin
  of the model.)  It is oriented so that x+ is east, y+
  is north and z+ is up (increasing altitude).
mxyz:
  This is the 'model' cartesian coordinate system used
  by the FXPAL V3D tools.

We will take the origin for lxyz and mxyz to be the same
so that the tranform between them is a pure rotation.

*/
WV.addCoordinateSystem = function(csName, csys)
{
   if (csys.heading == null)
      csys.heading = 0;
   var cs = {lat: csys.lat, lon: csys.lon, alt: csys.alt, heading: csys.heading};
//   var h = cs.heading * Math.PI / 180.0;
   var h = (270 + cs.heading) * Math.PI / 180.0;
   cs.origin_lla = [cs.lat, cs.lon, cs.alt];
   cs.origin_xyz = V3.latLonAltToCartesian(cs.origin_lla);
   cs.localToGlobal = M33.makeLocalToGlobalFrame(cs.origin_lla);
   cs.globalToLocal = M33.transpose(cs.localToGlobal)
   cs.modelToLocal = M33.identity();
   cs.modelToLocal[0] = V3.rotate(cs.modelToLocal[0], cs.modelToLocal[2], -h);
   cs.modelToLocal[1] = V3.rotate(cs.modelToLocal[1], cs.modelToLocal[2], -h);
   cs.localToModel = M33.transpose(cs.modelToLocal)
   WV.coordinateSystems[csName] = cs;
}

WV.xyzToLla = function(xyz, coordSys)
{
//    report("xyzToGeoPos: xyz: "+xyz+"  "+coordSys);
    if (coordSys.toLowerCase() == "geo") {
	//return {lat: xyz[0], lon: xyz[1], alt: xyz[2]};
	return xyz;
    }
    var cs = WV.coordinateSystems[coordSys];
    lxyz = M33.transform(cs.modelToLocal, xyz);
    gxyz = V3.add(cs.origin_xyz, M33.transform(cs.localToGlobal, lxyz));
    return V3.cartesianToLatLonAlt(gxyz);
}

WV.xyzToGeoPos = function(xyz, coordSys)
{
   if (coordSys.toLowerCase() == "geo") {
	return {lat: xyz[0], lon: xyz[1], alt: xyz[2]};
   }
   var lla = WV.xyzToLla(xyz, coordSys);
   return {lat: lla[0], lon: lla[1], alt: lla[2]};
}

WV.geoPosToXyz = function(lla, coordSys)
{
//    report("geoPosToXyz: lla: "+lla+"  "+coordSys);
   if (coordSys.toLowerCase() == "geo") {
       //return lla;
       return [lla.lat, lla.lon, lla.alt];
   }
    var cs = WV.coordinateSystems[coordSys];
    var gxyz = V3.latLonAltToCartesian(lla);
    var lxyz = M33.transform(cs.globalToLocal, V3.sub(gxyz, cs.origin_xyz));
    var xyz = M33.transform(cs.localToModel, lxyz);
    return xyz;
}

WV.testCoordTrans = function()
{
    var coordSys = WV.currentCoordSys;
    var numFails = 0;
    for (var x = -4; x<= 4; x++) {
       for (var y = -4; y<= 4; y++) {
          for (var z = -4; z<= 4; z++) {
             var lla = WV.xyzToLla([x,y,z], coordSys);
             var xyz = WV.geoPosToXyz(lla, coordSys);
             var dx = V3.sub([x,y,z], xyz);
             dx = dx.map(Math.abs);
             var mx = Math.max.apply({}, dx);
             report("test: "+[x,y,z]+" -> "+lla+" -> "+ xyz);
             report(" E: "+dx+ "    mx: "+mx);
             if (mx > 1.0E-8)
                numFails++;
          }
       }
    }
    report("numFailues: "+numFails);
}


var PAL_origin = {lat: 37.4058539, lon: -122.1507537, alt: 41.0, heading: 32.0};
//var YMM15_origin = {lat: 35.462857269, lon: 139.6276285, alt: 42.3, heading: 15.0};
//var YMM15_origin = {lat: 35.462857269, lon: 139.6276285, alt: 42.3, heading: 14.0};
var YMM15_origin = {lat: 35.462857269, lon: 139.6276285, alt: 42.3, heading: 14.4};

// Coordinate systems
//WV.addCoordinateSystem("PAL", PAL_origin);
//WV.addCoordinateSystem("YMM15", YMM15_origin);
WV.currentCoordSys = "PAL";
