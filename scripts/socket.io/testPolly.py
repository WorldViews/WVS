
from socketIO_client import SocketIO
from math import sin
import time, traceback

def sendMessages(sio):
    t = 0
    f = 0.2;
    while 1:
        t + .1
        yaw = 40 * sin(f*t)
        #sio.emit('polly', {'type': 'setYaw', 'yaw': yaw})
        try:
            sio.emit('polly', 'yaw %f' % yaw)
        except:
            traceback.print_exc()
        time.sleep(0.5)

def on_polly_response(*args):
    print('on_polly_response', args)

def run():
    sio = SocketIO('pollywss.paldeploy.com', 80)
    #sio = SocketIO('localhost', 80)
    #sio.on('polly.status', on_polly_response)
    sendMessages(sio)

run()

