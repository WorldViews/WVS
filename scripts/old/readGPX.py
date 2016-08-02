
import gpxpy
import gpxpy.gpx
import time
import json
import os

def genIndex(path, opath=None):
    print path
    name = os.path.splitext(os.path.basename(path))[0]
    print name
    indexObj = {}
    indexObj['coordinateSystem'] = "GEO"
    indexObj['name'] = name
    indexObj['locked'] = False
    gpx_file = open(path, 'r') 
    gpx = gpxpy.parse(gpx_file) 
    if len(gpx.tracks) > 1:
        print "**** Warning multiple tracks unexpected"
    track = gpx.tracks[0]
    if len(track.segments) > 1:
        print "**** Warning multiple segments in track"
    seg = track.segments[0]
    print seg
    recs = []
    t0 = None
    for point in seg.points:
        lat = point.latitude
        lon = point.longitude
        alt = point.elevation
        ts = point.time
        #print lat, lon, alt, ts,
        tup = ts.utctimetuple()
        t = time.mktime(tup)
        if t0 == None:
            t0 = t
        pt = {'pos': [lat, lon, alt], 'time': t, 'rt': t-t0}
        recs.append(pt)
        #print time.ctime(t)
    indexObj['recs'] = recs
    indexObj['startTime'] = t0
    indexObj['endTime'] = t
    indexObj['duration'] = t - t0
    if opath == None:
        opath = "%s.json" % name
    print "opath:", opath
    json.dump(indexObj, file(opath, "w"), indent=4, sort_keys=True)
    return indexObj

def test():
    path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\Gear 360\\FXPAL_Outside_Walkaround_1.gpx"
    opath = "../Viewer/data/paths/FXPAL_Outside_Walkaround_1.json"
    path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\GPX files\\Golden_Gate_Presidio.gpx"
    opath = "../Viewer/data/paths/Golden_Gate_Presidio.json"

    path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\Mark Hehir Vasona Lake County Park\\july_23_1102am.gpx"
    opath = "../Viewer/data/paths/Mark_Vasona.json"
    obj = genIndex(path, opath)
    #print obj

if __name__ == '__main__':
    test()


