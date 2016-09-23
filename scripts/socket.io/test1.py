#from socketIO_client import SocketIO
from socketIO_client import SocketIO, LoggingNamespace
import time

def on_aaa_response(*args):
    print('on_aaa_response', args)

#socketIO = SocketIO('pollywss.paldeploy.com', 80, LoggingNamespace)
#socketIO = SocketIO('pollywss.paldeploy.com', 80)
socketIO = SocketIO('localhost', 80)
socketIO.on('aaa_response', on_aaa_response)
for i in range(10):
    socketIO.emit('new message', 'don this is my message %d' % i)
    time.sleep(1)
socketIO.wait(seconds=1)
