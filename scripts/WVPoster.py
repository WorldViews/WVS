import json, requests

class WVPoster:
    def __init__(self, host="localhost", port=None):
        if port == None:
            self.server = "http://%s" % host
        else:
            self.server = "http://%s:%d" % (host, port)
        print "WVPoster server:", self.server

    def postToSIO(self, name, obj):
        url = self.server+"/sioput/"+name
        print "postToSIO url", url
        #print "posting", name, obj, url
        r = requests.post(url, data=json.dumps({'etype': name, 'obj': obj}))
        #print r.status_code, r.reason

    def addComment(self, parentId, comment, tname="notes"):
        url = self.server+"/comment/"+name
        #print "posting", name, obj, url
        r = requests.post(url, data=json.dumps({
                    'etype': name,
                    'parent': parentId,
                    'comment': comment}))
        #print r.status_code, r.reason


def testChat():
   vp = WVPoster()
   vp.postToSIO("chat", {'name': 'don'})

def testComment():
   vp = WVPoster()
   parentId = "note_1463090610967_499"
   comment = {'name': 'don',
              'text': 'yet another note'}
   vp.addComment(parentId, comment)


if __name__ == '__main__':
    #testChat()
    testChat()

