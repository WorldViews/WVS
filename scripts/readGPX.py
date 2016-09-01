
import urllib2
import gpxpy
import gpxpy.gpx
import time
import json
import os

def isUrl(str):
    if str.startswith("http:") or str.startswith("https:"):
        return True
    return False

def genIndex(path, opath=None, haveAltitude=False):
    """
    path could be a local file path or a url
    """
    print path
    name = os.path.splitext(os.path.basename(path))[0]
    print name
    indexObj = {}
    indexObj['coordinateSystem'] = "GEO"
    indexObj['name'] = name
    indexObj['locked'] = False
    indexObj['haveAltitude'] = haveAltitude
    if isUrl(path):
        gpx_file = urllib2.urlopen(path)
    else:
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
    return indexObj, opath

def test():
    """
    path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\Gear 360\\FXPAL_Outside_Walkaround_1.gpx"
    opath = "../Viewer/data/paths/FXPAL_Outside_Walkaround_1.json"
    path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\GPX files\\Golden_Gate_Presidio.gpx"
    opath = "../Viewer/data/paths/Golden_Gate_Presidio.json"
    """
    """
    path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\Mark Hehir Vasona Lake County Park\\july_23_1102am.gpx"
    opath = "xxx.json"
    #path = "\\\\palnas2\\vol1\\panobot\\videos\\Enock\\HenryCowell\\Redwood_Grove_Trail.gpx"
    path = "//palnas2/vol1/panobot/videos/Enock/HenryCowell/Redwood_Grove_Trail.gpx"
    opath = "../TeleViewer/static/data/paths/HenryCowellRedwoodGrove.json"
    """
    
    
  
    """
    url = "http://www.gobeyondthefence.com/wp-content/uploads/2016/07/Aug_14_2016_121232_PM_2016-08-14_12-12-32.gpx"
    obj = genIndex(url)
    path = "//palnas2/vol1/panobot/videos/Enock/Stearman_Flight_GPX/Aug_14,_2016_12;12;32_PM_2016-08-14_12-12-32.gpx"
    opath = "../TeleViewer/static/data/paths/Stearman_Flight.json"
    obj = genIndex(path, opath, haveAltitude=True)
    """
    path = "//palnas2/vol1/panobot/videos/Enock/Winery_Museum_GPX/Aug_14,_2016_1;17;45_PM_2016-08-14_13-17-45.gpx"
    opath = "../TeleViewer/static/data/paths/Winery_Museum.json"
    genIndex(path,opath)
    
if __name__ == '__main__':
    test()


