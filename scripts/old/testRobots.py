
import sys, time
from math import sin,cos
import WVPoster

SLEEP_TIME = 0.1

def run():
    wvp = WVPoster.WVPoster("tours.paldeploy.com")
    i = 0
    while 1:
        i += 1
        x = 20+5*cos(i/10.0)
        y = 15 + 10*sin(i/10.0)
        obj = {'type': 'robot',
               'id': 'pal_robot_beam1',
               'coordSys': 'PAL',
               'status': 'available',
               'position': [x, y, 0]}
        print "posting", obj
        wvp.postToSIO("robots", obj)
        print "Sleeping for", SLEEP_TIME
        time.sleep(SLEEP_TIME)


if __name__ == '__main__':
    run()

