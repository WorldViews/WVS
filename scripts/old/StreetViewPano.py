"""
Based on
http://www.newtonscannon.com/2014/01/26/capturing-spherical-scenes-from-google-streetview/

"""
import os, urllib2
import Image

#TILE_URL = "http://cbk0.google.com/cbk?output=tile&panoid=%(panoId)s&zoom=5&x=[0-25]&y=[0-12]"
TILE_URL = "http://cbk0.google.com/cbk?output=tile&panoid=%(panoId)s&zoom=5&x=%(x)s&y=%(y)s"

def verifyDir(path):
    if not os.path.exists(path):
        print "Creating Dir", path
        os.mkdir(path)

class StreetViewPan:
     def __init__(self):
         pass

     def stitchTiles(self, dir, outFile):
         im0 = Image.open(os.path.join(dir, "tile_0_0.jpg"))
         tw,th = im0.size
         print "im0.size:", im0.size
         pw = 26*tw
         ph = 13*th
         pano = Image.new("RGB", (pw, ph))
         for x in range(25+1):
             for y in range(12+1):
                 name = os.path.join(dir, "tile_%s_%s.jpg" % (x,y))
                 im = Image.open(name)
                 pano.paste(im, (x*tw, y*th))
                 print x, y, name, im.size
         pano.save(outFile)

     def getTile(self, id, outDir=None, panoPath=None):
         if outDir == None:
             outDir = "%s.tiles" % id
         if panoPath == None:
             panoPath = "%s.jpg" % id
         verifyDir(outDir)
         for x in range(25+1):
             for y in range(12+1):
                 url = TILE_URL % {'panoId': id, 'x': x, 'y': y}
                 print url
                 outPath = os.path.join(outDir, "tile_%s_%s.jpg" % (x,y))
                 if os.path.exists(outPath):
                     continue
                 print url
                 uos = urllib2.urlopen(url)
                 buf = uos.read()
                 print "outPath %d bytes" % len(buf)
                 file(outPath, "wb").write(buf)
         self.stitchTiles(outDir, panoPath)


def test():
    svp = StreetViewPan()
    #svp.getTile("3gZxX9d3PsMAAAQo8BOSJw")
    #svp.getTile("ylk1q-3hNVYAAAQZcqB_Xg")
    #svp.getTile("LM4149mRPVSF7movRaTbeg")
    #svp.getTile("eOn4nKxrQV0AAAQo8BOSJg");
    svp.getTile("hE9PFK4uiU0AAAQqZe0Gfw")

if __name__ == '__main__':
    test()



