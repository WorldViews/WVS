"""
This program reads csv files produced by the Litchi
program for dji drones and produces KML files.
"""
import os, sys, csv, json
import KMLUtil

FLIGHT_LOG = "FLIGHT_LOG"
MISSION = "MISSION"

METERS_PER_FOOT = 0.3048

"""
FIELDS = [
    "time(millisecond)", 
    "longitude", 
    "latitude", 
    "altitude(feet)"
]
"""

KML_TEMPLATE = \
"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Paths</name>
    <description>Examples of paths. Note that the tessellate tag is by default
      set to 0. If you want to create tessellated lines, they must be authored
      (or edited) directly in KML.</description>
    <Style id="yellowLineGreenPoly">
      <LineStyle>
        <color>%(color)s</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Absolute Extruded</name>
      <description>Transparent green wall with yellow outlines</description>
      <styleUrl>#yellowLineGreenPoly</styleUrl>
      <LineString>
<!--
        <extrude>1</extrude>
        <tessellate>1</tessellate>
-->
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>
          %(coordinateRows)s
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""

def getFullData(path):
    """
    read csv file into list of dictionaries
    using first line as keys.
    returns list of keys, and list of rows.
    """
    reader = csv.reader(file(path, "rb"))
    header = None
    data = []
    for row in reader:
        if not header:
            header = row
            continue
        obj = {}
        for k in range(len(header)):
            obj[header[k]] = row[k]
        data.append(obj)
    #print header
    return header, data

"""
def getFieldData(data, fieldSpecs):
    ndata = []
    for item in data:
        obj = {}
        for f in fieldSpecs:
            obj[f] = item[f]
        ndata.append(obj)
    return ndata

def saveKML(data, pathOrFile):
    pass

def dumpFields(path, fields):
    header, data = getDicts(path)
    #print "header:\n", header
    for key in fields:
        print key,
    print
    print
    for item in data:
        for key in fields:
            #print key, item[key]
            print item[key],
        print
"""

def getFlightLogTups(header, rows):
    tups = []
    for row in rows:
        lat =   float(row['latitude'])
        lon =   float(row['longitude'])
        alt =   float(row['altitude(feet)']) * METERS_PER_FOOT
        t =     float(row['time(millisecond)'])/1000.0
        ct =    row['datetime(local)']
        yaw =   row['yaw(deg)']
        pitch = row['pitch(deg)']
        roll =  row['roll(deg)']
        tup = t, ct, lat, lon, alt, yaw, pitch, roll
        tups.append(tup)
    return tups

def getMissionTups(header, rows):
    tups = []
    for row in rows:
        lat =   float(row['latitude'])
        lon =   float(row['longitude'])
        if 'altitude(m)' in row:
            alt =   float(row['altitude(m)'])
        elif 'altitude(ft)' in row:
            alt =   float(row['altitude(ft)'])*METERS_PER_FOOT
        else:
            print "No altitude found in row"
            print "row:"
            raise ValueError
        tup = lat, lon, alt
        tups.append(tup)
    return tups

def getTups(path):
    header, rows = getFullData(path)
    print "len(header)", len(header)
    if len(header) == 79:
        return FLIGHT_LOG, getFlightLogTups(header, rows)
    if len(header) == 38:
        return MISSION, getMissionTups(header, rows)
    return None

def dumpTup(tup, f=sys.stdout):
    t, ct, lat, lon, alt, yaw, pitch, roll = tup
    f.write("%s %s %s %s %s %s %s %s\n" % \
                (t, ct, lat, lon, alt, yaw, pitch, roll))

def dumpTups(tups, f=sys.stdout):
    for tup in tups:
        dumpTup(tup, f)

def dumpFlightLogKML(tups, f=sys.stdout):
    coordsStr = ""
    for tup in tups:
        t, ct, lat, lon, alt, yaw, pitch, roll = tup
        cstr = "              %s,%s,%s\n" % (lon, lat, alt)
        coordsStr += cstr
    color = "ef00ffff"
    kmlStr = KML_TEMPLATE % {'coordinateRows': coordsStr, 'color': color}
    f.write(kmlStr)


def dumpFlightJSON(tups, f):
    recs = []
    t0 = None
    for tup in tups:
        mt, ct, lat, lon, alt, yaw, pitch, roll = tup
        t = mt
        if t0 == None:
            t0 = t
            ct0 = ct
        pt = {'pos': [lat, lon, alt], 'time': t, 'rt': t-t0}
        recs.append(pt)
    obj = {'recs': recs,
           'datetime': ct0,
           'startTime': t0,
           'endTime': t,
           'duration': t-t0}
    json.dump(obj, f, indent=4)

def dumpMissionKML(tups, f=sys.stdout, closed=False):
    coordsStr = ""
    if closed:
        print "Closing path"
        tups.append(tups[0])
    for tup in tups:
        lat, lon, alt = tup
        cstr = "              %s,%s,%s\n" % (lon, lat, alt)
        coordsStr += cstr
    color = "7f0000ff"
    kmlStr = KML_TEMPLATE % {'coordinateRows': coordsStr, 'color': color}
    f.write(kmlStr)

"""
def csvToKml(csvPath, kmlPath, runIt=True):
    ret = getTups(csvPath)
    if not ret:
        print "Unrecongized CSV file"
        return
    ftype, tups = ret
    print "FileType:", ftype
    if ftype == FLIGHT_LOG:
        dumpFlightLogKML(tups, file(kmlPath, "w"))
    elif ftype == MISSION:
        dumpMissionKML(tups, file(kmlPath, "w"))
    else:
        print "Unknown file type"
    if runIt:
        com = "start "+kmlPath
        os.system(com)
"""

def csvToKml(csvPath, kmlPath, jsonPath=None, runIt=True):
    if jsonPath == None:
        jsonPath = kmlPath.replace(".kml", ".json")
        print "jsonPath:", jsonPath
    ret = getTups(csvPath)
    if not ret:
        print "Unrecongized CSV file"
        return
    ftype, tups = ret
    print "FileType:", ftype
    if ftype == FLIGHT_LOG:
        dumpFlightLogKML(tups, file(kmlPath, "w"))
        if jsonPath:
            print "Saving to", jsonPath
            dumpFlightJSON(tups, file(jsonPath, "w"))
    elif ftype == MISSION:
        dumpMissionKML(tups, file(kmlPath, "w"), False)
    else:
        print "Unknown file type"
    if runIt:
        com = "start "+kmlPath
        os.system(com)


def csvToKmlPic(csvPath, kmlPath, showUp=False, showDown=True, runIt=True):
    kml = KMLUtil.KML()
    ret = getTups(csvPath)
    if not ret:
        print "Unrecongized CSV file"
        return
    ftype, tups = ret
    print "FileType:", ftype
    recs = []
    if ftype == FLIGHT_LOG:
        for tup in tups:
            t, ct, lat, lon, alt, yaw, pitch, roll = tup
            rec = (lat, lon, alt)
            recs.append(rec)
    elif ftype == MISSION:
        for tup in tups:
            lat, lon, alt = tup
            rec = (lat, lon, alt)
            recs.append(rec)
    else:
        print "Unknown file type"
    h0 = 7
    #h0 = 90
    path = []
    prevState = None
    UP = "UP"
    DOWN = "DOWN"
    downStyle = "#whiteStyle"
    upStyle = "#redGhost"
    for rec in recs:
        h = rec[2]
        state = UP if h > h0 else DOWN
        #print rec, state
        if state != prevState:
            if prevState == DOWN and showDown and len(path) > 0:
                #print "DOWN:\n", path
                kml.addPath(path, lineStyle=downStyle)
            if prevState == UP and showUp and len(path) > 0:
                #print "DOWN:\n", path
                kml.addPath(path, lineStyle=upStyle)
                pass
            path = []
        path.append(rec)
        prevState = state
    if prevState == DOWN and showDown and len(path) > 0:
        #print "DOWN:\n", path
        kml.addPath(path, lineStyle=downStyle)
    if prevState == UP and showUp and len(path) > 0:
        #print "DOWN:\n", path
        kml.addPath(path, lineStyle=upStyle)
    kml.save(kmlPath)
    if runIt:
        com = "start "+kmlPath
        os.system(com)


def run():
    """
    path = "//palnas2/vol1/panobot/videos/Enock/Phantom_4_Flightlogs/2016-08-03_18-53-20_v2.csv"
    csvToKml(path, "flight1.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/Lagunita_Lake_Flight_Logs/2016-08-05_17-29-05_v2.csv"
    csvToKml(path, "laganita1.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/Lagunita_Lake_Flight_Logs/2016-08-05_17-37-42_v2.csv"
    csvToKml(path, "laganita2.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/Lagunita_Lake_Missions/Lake_Lagunita_Short.csv"
    csvToKml(path, "laganita_mission_long.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/Lagunita_Lake_Missions/Lagunita_Lake_Long.csv"
    csvToKml(path, "laganita_mission_long.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/FXPAL_POI_Mission/FXPAL_POI_Mission2.csv"
    csvToKml(path, "FXPAL_POI_Mission2.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/FXPAL_POI_Mission/FXPAL_POI_Mission3.csv"
    csvToKml(path, "FXPAL_POI_Mission3.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/FXPAL_POI_Mission/2016-08-06_16-24-43_v2.csv"
    csvToKml(path, "flightLog.kml")
    path = "//palnas2/vol1/panobot/videos/Enock/Write_FXPAL/Write_FXPAL.csv"
    csvToKml(path, "Write_FXPAL.kml")
    csvToKml2(path, "Write_FXPAL_.kml", runIt=False)
    path = "//palnas2/vol1/panobot/videos/Enock/FXPAL_POI_Mission/2016-08-06_16-24-43_v2.csv"
    csvToKml2(path, "PAL_FlyAround_1.kml", runIt=False)
    """
    path = "//palnas2/vol1/panobot/videos/Enock/Write_FXPAL_Flightlog/2016-08-10_17-59-05_v2.csv"
    csvToKmlPic(path, "Write_FXPAL_flight_down.kml", showUp=False)
    csvToKmlPic(path, "Write_FXPAL_flight_all.kml", showUp=True)

if __name__ == "__main__":
    run()



