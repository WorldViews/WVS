"""
This program reads csv files produced by the Litchi
program for dji drones and produces KML files.
"""
import os, sys


KML_TEMPLATE = \
"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Paths</name>
    <description>Examples of paths. Note that the tessellate tag is by default
      set to 0. If you want to create tessellated lines, they must be authored
      (or edited) directly in KML.</description>
    <Style id="lineStyle">
      <LineStyle>
        <color>7fffffff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>
    <Style id="whiteStyle">
      <LineStyle>
        <color>Afffffff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>
    <Style id="ghostStyle">
      <LineStyle>
        <color>1fffffff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f0000ff</color>
      </PolyStyle>
    </Style>
    <Style id="redStyle">
      <LineStyle>
        <color>7f0000ff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f0000ff</color>
      </PolyStyle>
    </Style>
    <Style id="redGhost">
      <LineStyle>
        <color>3f0000ff</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>2f0000ff</color>
      </PolyStyle>
    </Style>
    <Style id="greenStyle">
      <LineStyle>
        <color>7f00ff00</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>
    <Style id="blueStyle">
      <LineStyle>
        <color>7fff0000</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7fff0000</color>
      </PolyStyle>
    </Style>
%(lineStrings)s
  </Document>
</kml>
"""

LINE_STRING_TEMPLATE = \
"""
    <Placemark>
      <name>%(name)s</name>
      <description>Transparent green wall with yellow outlines</description>
      <styleUrl>%(lineStyle)s</styleUrl>
      <LineString>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>
%(coordinateRows)s
        </coordinates>
      </LineString>
    </Placemark>
"""

class KML:
    def __init__(self):
        self.lineStrings = []

    def addPath(self, points, name=None, lineStyle="#lineStyle", closed=False):
        coordsStr = ""
        n = len(self.lineStrings)
        if name == None:
            name = "path%d" % n
        if closed:
            points.append(points[0])
        for pt in points:
            if type(pt) in [type([]), type((1,))]:
                lat, lon, alt = pt
            else:
                lat = pt['lat']
                lon = pt['lon']
                alt = pt['alt']
            cstr = "              %s,%s,%s\n" % (lon, lat, alt)
            coordsStr += cstr
        lineStr = LINE_STRING_TEMPLATE % \
            {'coordinateRows': coordsStr,
             'name': name,
             'lineStyle': lineStyle}
        self.lineStrings.append(lineStr)

    def save(self, pathOrFile=sys.stdout, autoView=False):
        f = pathOrFile
        kmlPath = None
        if type(pathOrFile) in [type("str"), type(u"str")]:
            kmlPath = pathOrFile
            print "saving to", kmlPath
            f = open(kmlPath, "w")
        lineStrs = "\n".join(self.lineStrings)
        color = "7f0000ff"
        kmlStr = KML_TEMPLATE % {'lineStrings': lineStrs,
                                 'color': color}
        f.write(kmlStr)
        f.close()
        if autoView and kmlPath:
            print "running", kmlPath
            os.system(kmlPath);

def test():
    line1 = [
         {"lon": -122.1512, "lat": 37.405, "alt": 0.0},
         {"lon": -122.1513, "lat": 37.406, "alt": 5.0},
    ]
    line2 = [
         {"lon": -122.1510, "lat": 37.400, "alt": 0.0},
         {"lon": -122.1516, "lat": 37.416, "alt": 5.0},
    ]

    kml = KML()
    kml.addPath(line1, lineStyle="#redStyle")
    kml.addPath(line2, lineStyle="#redStyle")
    kml.save("foobar.kml")

if __name__ == "__main__":
    test()



