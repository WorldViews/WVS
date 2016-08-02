
import urllib2
from StringIO import StringIO
from PIL import Image

WATER_COLOR = (226, 232, 220)

#URL = "http://maps.googleapis.com/maps/api/staticmap?center=%(lat)s,%(lon)s&zoom=5&size=500x500&maptype=roadmap&sensor=false"
URL = "http://maps.googleapis.com/maps/api/staticmap?center=%(lat)s,%(lon)s&zoom=5&size=%(size)sx%(size)s&maptype=roadmap&sensor=false"

def overWater(lat, lon):
    size = 3
    url = URL % {'lat': lat, 'lon': lon, 'size': size}
    #print "fetching url:", url
    uos = urllib2.urlopen(url)
    buf = uos.read()
    #file("foo.png", "wb").write(buf)
    f = StringIO(buf)
    im = Image.open(f)
    #im.save("bar.png")
    im2 = Image.new("RGB", im.size, (255,255,255))
    im2.paste(im)
    m = int(size/2)
    #print "size:", im.size, m
    #px = im.getpixel((m,m))
    px = im2.getpixel((m,m))
    if px == WATER_COLOR:
        return True
    return False

def overLand(lat, lon):
    return not overWater(lat, lon)

def test():
    print overWater(43,-120)
    print overWater(43,-124)

if __name__ == '__main__':
    test()

