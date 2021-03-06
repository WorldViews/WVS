"""
This is basically a simple HTTP server that can handle a few
upload requests from PhysViz apps.  Particularly, saving bookmarks.
"""
import SimpleHTTPServer
import SocketServer
import urlparse
import shutil
import json
import sys, time
sys.path.append("scripts")
try:
    import ImageTweets
    ImageTweets.IMAGE_DIR = "images/twitter_images"
except:
    print "No ImageTweets module"

REG = {}
#PORT = 8001
PORT = 8000
PREV_YOUTUBE_ID = None
STATIC_PREFIX = "/static"
STATIC_DIR = "../static"

def getQuery(path):
    i = path.rfind("?")
    if i < 0:
        return {}
    return urlparse.parse_qs(path[i+1:])

print "PhysVis"

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        print "translate_path", path
        if self.path.startswith(STATIC_PREFIX):
            if self.path == STATIC_PREFIX or self.path == STATIC_PREFIX+"/":
                path = STATIC_DIR + "/index.html"
            else:
                path = STATIC_DIR + path[len(STATIC_PREFIX):]
        else:
            path = SimpleHTTPServer.SimpleHTTPRequestHandler.translate_path(self, path)
        print "path:", path
        return path

    def do_GET(self):
        if self.path.startswith("/wvgetdata"):
            return self.handleGetData()
        if self.path.startswith("/imageTweets"):
            return self.handleGetImageTweets()
        if self.path.startswith("/wvCurrentUrl"):
            return self.getCurrentUrl()
        if self.path.startswith("/notify/"):
            return self.handleNotify()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        print "POST path:", self.path
        if self.path.startswith("/update/"):
            return self.handleUpdate()
        if self.path.startswith("/register/"):
            return self.handleRegister()
        if self.path.startswith("/notify/"):
            return self.handleNotify()
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self)

    def end_headers(self):
        #print "sending CORS header"
        self.send_header("Access-Control-Allow-Origin", "*")
        SimpleHTTPServer.SimpleHTTPRequestHandler.end_headers(self)

    def send_data(self, str, ctype):
        self.send_response(200)
        #self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-type", ctype)
        self.send_header("Content-Length", len(str))
        self.end_headers()
        self.wfile.write(str)
        
    def handleRegister(self):
        #print "POST headers:", self.headers
        global REG
        content_len = int(self.headers.getheader('content-length', 0))
        body = self.rfile.read(content_len)
        obj = json.loads(body)
        print obj
        try:
            dtype = obj['type']
            id = obj['id']
            if dtype not in REG:
                REG[dtype] = {}
            REG[dtype][id] = obj
            print "REG:", REG
        except KeyError:
            print "Don't have all fields"
        self.send_data("Ok", "text/plain")

    def handleUpdate(self):
        print "POST headers:", self.headers
        content_len = int(self.headers.getheader('content-length', 0))
        body = self.rfile.read(content_len)
        obj = json.loads(body)
        print obj
        path = self.path[len("/update/"):]
        print "path", path
        try:
            shutil.copyfile(path, path+".bak")
        except:
            pass
        json.dump(obj, file(path, "w"), indent=3)

    def handleGetImageTweets(self):
        print "path:", self.path
        q = getQuery(self.path)
        print "q:", q
        it = ImageTweets.ImageTweets()
        prevEndNum = None
        if 'prevEndNum' in q:
            prevEndNum = int(q['prevEndNum'][0])
        maxNum = None
        if 'maxNum' in q:
            maxNum = int(q['maxNum'][0])
        images = it.get(maxNum=maxNum, prevEndNum=prevEndNum)
        obj = {'recs': images}
        jObj = json.dumps(obj, sort_keys=True, indent=4)
        #print jObj
        self.send_data(jObj, "application/json")

    def handleGetPeople(self):
        print "path:", self.path
        q = getQuery(self.path)
        print "q:", q
        jObj = json.dumps(obj, sort_keys=True, indent=4)
        #print jObj
        self.send_data(jObj, "application/json")

    def handleGetData(self):
        print "path:", self.path
        q = getQuery(self.path)
        dtype = None
        if 'type' in q:
            dtype = q['type'][0];
        if dtype == 'photos':
            return self.handleGetImageTweets()
        else:
            data = REG[dtype]
            obj = {'recs': data.values()}
            jObj = json.dumps(obj, sort_keys=True, indent=4)
            #print jObj
            self.send_data(jObj, "application/json")
        self.send_data("Ok", "text/plain")

    def handleNotify(self):
        print "handleNotify"
        print "path:", self.path
        q = getQuery(self.path)
        print "q:", q
        if 'youtubeId' in q:
            global PREV_YOUTUBE_ID
            PREV_YOUTUBE_ID = q['youtubeId'][0]
            print "PREV_YOUTUBE_ID:", PREV_YOUTUBE_ID
        self.send_data("Ok", "text/plain")
        
    def getCurrentUrl(self):
        url = "https://youtube.com"
        if PREV_YOUTUBE_ID:
            url = "https://www.youtube.com/watch?v=%s" % PREV_YOUTUBE_ID
        self.send_response(301)
        self.send_header("Location",url)
        self.end_headers()
        return None

def run(port=PORT):
    print "PhysVizServer HTTP on port", port
    time.sleep(0.5)
#    httpd = SocketServer.TCPServer(("", port), MyHandler)
    httpd = SocketServer.ThreadingTCPServer(("0.0.0.0", port), MyHandler)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
