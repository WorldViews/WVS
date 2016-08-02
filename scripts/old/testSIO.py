
import time
from threading import Thread
import socketIO_client

class SIO:
    def __init__(self, host="localhost", port=80):
        print "SIO", host, port
        self.sio = socketIO_client.SocketIO(host, port)
        self.sio.on("periscope", self.onPeriscopeResponse)
        self.sio.on("chat", self.onChatResponse)

    def runInThread(self):
        print "SIO.runInThread"
        self.thread = Thread(target=self.runSIO)
        self.thread.setDaemon(True)
        print "starting thread..."
        self.thread.start()

    def runSIO(self):
        print "SIO starting watcher thread"
        self.sio.wait()

    def emit(name, obj):
        print "emit:", obj
        self.sio.emit(name, obj)

    def onPeriscopeResponse(self, *args):
        print "<<<<<<<<<<<<<"
        print "onPeriscopeResponse:", args
        print ">>>>>>>>>>>>>"

    def onChatResponse(self, *args):
        print "<<<<<<<<<<<<<"
        print "onPeriscopeResponse:", args
        print ">>>>>>>>>>>>>"
    

def testSIO():
    sio = SIO()
    sio.runInThread()
    while 1:
        time.sleep(5)
        print "tick..."

if __name__ == '__main__':
#    run()
#    getGeo("Mountain View, CA")
#    run()
    testSIO()
    
