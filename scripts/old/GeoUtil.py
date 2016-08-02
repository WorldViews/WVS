
import math
import numpy
from numpy.linalg import norm
from numpy import cross, array, transpose, dot, eye
"""
Note, dot(A,B) is matrix A times B
for vectors u,v    u*v is the scalar project
"""

PI = math.pi
NaN = float('nan')
EARTH_RADIUS = 6378100

COORDINATE_SYSTEMS = {}

class CoordSys:
    def __init__(self, name, lat, lon, alt, h):
        self.name = name
        self.lat = lat
        self.lon = lon
        self.alt = alt
        self.heading = h
        self.init()

    def init(self):
        self.origin_lla = array([self.lat, self.lon, self.alt])
        self.origin_xyz = latLonAltToCartesian(self.origin_lla)
        self.localToGlobal = makeLocalToGlobalFrame(self.origin_lla)
        self.globalToLocal = transpose(self.localToGlobal)
        h = (270 + self.heading) * PI / 180.0;
        self.modelToLocal = eye(3);
        self.modelToLocal[0] = rotate(self.modelToLocal[0], self.modelToLocal[2], -h);
        self.modelToLocal[1] = rotate(self.modelToLocal[1], self.modelToLocal[2], -h);
        self.localToModel = transpose(self.modelToLocal)

    def dump(self):
        print "CoordSys", self.name
        print "origin_lla:", self.origin_lla
        print "origin_xyz:", self.origin_xyz
        print "G2L:\n", self.globalToLocal
        print "L2G:\n", self.localToGlobal
        #I = matrixmultiply(self.globalToLocal, self.localToGlobal)
        I = dot(self.globalToLocal, self.localToGlobal)
        print "I:\n", I
        print "M2L:\n", self.modelToLocal
        print "L2M:\n", self.localToModel
        I = dot(self.modelToLocal, self.localToModel)
        print "I:\n", I

    def xyzToLatLonAlt(self, xyz):
        lxyz = dot(xyz, self.modelToLocal)
        #print "lxyz:", lxyz
        gxyz = self.origin_xyz + dot(lxyz, self.localToGlobal)
        #print "gxyz:", gxyz
        return cartesianToLatLonAlt(gxyz)

    def latLonAltToXYZ(self, lla):
        gxyz = latLonAltToCartesian(lla)
        lxyz = dot((gxyz - self.origin_xyz), self.globalToLocal)
        xyz = dot(lxyz, self.localToModel)
        return xyz;

def normalize(v):
    return v / norm(v)

def rotate(v, axis, radians):
    vDotAxis = dot(v, axis)
    vPerpAxis = v - axis*vDotAxis
    vPerpPerpAxis = cross(axis, vPerpAxis)
    result = axis*vDotAxis + vPerpAxis*math.cos(radians) + vPerpPerpAxis*math.sin(radians)
    return result

def makeLocalToGlobalFrame(latLonAlt):
    vert = normalize(latLonAltToCartesian(latLonAlt))
    east = normalize(cross([0, 1, 0], vert))
    north = normalize(cross(vert, east))
    return array([east, north, vert])

def addCoordinateSystem(cs):
    name = cs.name
    COORDINATE_SYSTEMS[name] = cs
    #cs.dump()

# Input is [lat, lon, alt], lat & lon in degrees, alt in meters.
# Output is cartesian [x,y,z] in meters
def latLonAltToCartesian(vert):
    sinTheta = math.sin(vert[1] * PI / 180)
    cosTheta = math.cos(vert[1] * PI / 180)
    sinPhi = math.sin(vert[0] * PI / 180)
    cosPhi = math.cos(vert[0] * PI / 180)
    r = EARTH_RADIUS + vert[2];
    result = array([
        r * cosTheta * cosPhi,
        r * sinPhi,
        r * -sinTheta * cosPhi ])
    return result

# Input is meters [x, y, z].  Output is [lat, lon, alt].
# Lat & lon in degrees, alt in meters.
def cartesianToLatLonAlt(a):
    r = norm(a);
    if r <= 0:
      return [NaN, NaN, NaN];
    alt = r - EARTH_RADIUS;
    # Compute projection onto unit sphere.
    n = a / r
    #var n = V3.scale(a, 1 / r);
    lat = math.asin(n[1]) * 180 / PI;
    if lat > 90:
      lat -= 180
    lon = 0;
    if abs(lat) < 90:
      lon = math.atan2(n[2], n[0]) * -180 / PI;
    return array([lat, lon, alt]);


def test1():
    latLonAlt = [40, -120, 0]
    print "latLonAlt:", latLonAlt
    xyz = latLonAltToCartesian(latLonAlt)
    print "xyz:", xyz
    lla2 = cartesianToLatLonAlt(xyz)
    print "latLonAlt2:", lla2
    print "-------------"
    cs = CoordSys('PAL', 45, -120, 0, 20)
    addCoordinateSystem(cs)
    for xyz in [array([0,0,0]), array([10,0,0]), array([0,10,0]), array([10,10,0])]:
        print "xyz:", xyz
        lla = cs.xyzToLatLonAlt(xyz)
        print "lla:", lla
        xyz2 = cs.latLonAltToXYZ(lla)
        print "xyz2:", xyz2
        print

def testCS(cs):
    print "-------------------------"
    cs.dump()
    print
    print "name:", cs.name
    print "lat:", cs.lat, "  lon:", cs.lon, "  alt:", cs.alt
    print "    x      y      z      lat         lon           alt "
    print "-------------------------------------------------------"
    for x in [-40, 20, 0, 20, 40]:
        for y in [-40, -20, 0, 20, 40]:
            xyz = array([x,y,0])
            #print "xyz:", xyz
            lla = cs.xyzToLatLonAlt(xyz)
            #print "lla:", lla
            print "%6.1f %6.1f %6.1f   %10.6f %10.6f %8.1f" %\
                    (xyz[0], xyz[1], xyz[2], lla[0], lla[1], lla[2])
            xyz2 = cs.latLonAltToXYZ(lla)
            #print "xyz2:", xyz2
            err = xyz2-xyz
            #print "err:", err
            em = err.max()
            if em > 1.0E-6:
                print "**** ERROR ****"
                print "xyz2:", xyz2


def test2():
    cs = CoordSys('PAL', 37.40583, -122.1508, 41, 32)
    addCoordinateSystem(cs)
    testCS(cs)

def test3():
    cs = CoordSys('PAL', 37.40583, -122.1508, 41, 32)
    cs.dump()
    xyz = [20,20,0]
    lla = cs.xyzToLatLonAlt([20,20,0])
    print "xyz:", xyz
    print "lla:", lla


if __name__ == '__main__':
    #test1()
    test2()
    #test3()


