from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt

def map1():
    # setup Lambert Conformal basemap.
    m = Basemap(width=12000000,height=9000000,projection='lcc',
                resolution='c',lat_1=45.,lat_2=55,lat_0=50,lon_0=-107.)
    # draw coastlines.
    m.drawcoastlines()
    # draw a boundary around the map, fill the background.
    # this background will end up being the ocean color, since
    # the continents will be drawn on top.
    m.drawmapboundary(fill_color='aqua')
    # fill continents, set lake color same as ocean color.
    m.fillcontinents(color='coral',lake_color='aqua')
    plt.show()

def map2():
    # setup Lambert Conformal basemap.
    # set resolution=None to skip processing of boundary datasets.
    m = Basemap(width=12000000,height=9000000,projection='lcc',
                resolution=None,lat_1=45.,lat_2=55,lat_0=50,lon_0=-107.)
    m.etopo()
    plt.show()


def map3():
    # setup Lambert Conformal basemap.
    # set resolution=None to skip processing of boundary datasets.
    m = Basemap()
    m.drawcoastlines()
    m.etopo()
    plt.show()


map3()
