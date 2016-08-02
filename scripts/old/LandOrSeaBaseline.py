
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt

MAP = None
#MAP = Basemap(width=12000000,height=9000000,projection='lcc',
#                resolution='c',lat_1=45.,lat_2=55,lat_0=50,lon_0=-107.)
MAP = Basemap()
MAP.drawcoastlines()

def overLand(lat, lon):
    print "lat, lon", lat, lon
    x,y = MAP(lon,lat)
    print "x,y", x, y
    v = MAP.is_land(x,y)
    print "overLand:", v
    return v

def overWater(lat, lon):
    return not overLand(lat, lon)

def test():
    print overWater(43,-120)
    print overWater(43,-124)
    print overWater(40,-126)

if __name__ == '__main__':
    test()

