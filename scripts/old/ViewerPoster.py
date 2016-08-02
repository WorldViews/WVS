import json, requests

class WVPoster:
    def __init__(self, host="localhost", port=None):
        if port == None:
            self.url = "http://%s/sioput/" % host
        else:
            self.url = "http://%s:%d/sioput/" % (host, port)

    def postToSIO(self, name, obj):
        url = self.url+name
        print "posting", name, obj, url
        r = requests.post(url, data=json.dumps({'name': name, 'obj': obj}))
        print r.status_code, r.reason


def test():
   vp = WVPoster()
   vp.postToSIO("chat", {'name': 'don'})


if __name__ == '__main__':
    test()

