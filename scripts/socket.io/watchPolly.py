
from socketIO_client import SocketIO
import time

def on_polly_response(*args):
    print('on_polly_response', args)

def run():
    sio = SocketIO('pollywss.paldeploy.com', 80)
    sio.on('polly', on_polly_response)
    sio.wait()

run()

