"""
This can generate a flight plan from a DXF showing the
paths to spell out words in simple 'stick font' as produced
by the programs StickFont v1.1.

http://ncplot.com/stickfont/stickfont.htm

"""
import json, dxfgrabber
import KMLUtil
import GeoUtil

def getLines(path, scale=1.0):
    dxf = dxfgrabber.read(file(path))
    ents = dxf.entities
    i = 0
    lines = []
    for e in ents:
        i += 1
        #print e
        x1,y1,z1 = e.start
        x1,y1,z1 = scale*x1, scale*y1, scale*z1
        x2,y2,z2 = e.end
        x2,y2,z2 = scale*x2, scale*y2, scale*z2
        if z1 != 0 or z2 != 0:
            print "Not flat!!!!!"
            continue
        print "%2d %9.5f %9.5f   %9.5f %9.5f" % (i, x1, y1, x2, y2)
        lines.append((x1,y1,x2,y2))
    json.dump(lines, file("FXPAL_lines.json","w"), indent=4)
    return lines


def genPlan(path):
    #cs = GeoUtil.CoordSys('Lagunita',37.4219,-122.19, 90)
    cs = GeoUtil.CoordSys('Lagunita', 37.4216, -122.1775, 0, 90)

    lines = getLines(path, scale=10.0)
    kml = KMLUtil.KML()
    for line in lines:
        x1,y1, x2,y2 = line
        lat1,lon1,alt1 = cs.xyzToLatLonAlt([x1,y1,0])
        lat2,lon2,alt2 = cs.xyzToLatLonAlt([x2,y2,0])
        kml.addPath([{'lat': lat1, 'lon': lon1, 'alt': alt1},
                     {'lat': lat2, 'lon': lon2, 'alt': alt2}])
    kml.save("fooPlan.kml", autoView=True)

genPlan("FXPAL.dxf")
