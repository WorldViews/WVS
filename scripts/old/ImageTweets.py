
import time, json, os, glob

IMAGE_DIR = "../images/twitter_images"

class ImageTweets:
    def __init__(self):
        self.dir = IMAGE_DIR
    
    def saveJSON(self, jsonPath):
        ims = self.get()
        obj = {'type': 'imageTweets',
               't': time.time(),
               'numRecords': len(ims),
               'records': ims}
        json.dump(obj, file(jsonPath, "w"), indent=3, sort_keys=True)

    def get(self, maxNum=None, startTime=None, prevEndNum=None):
        t0 = time.time()
        objs = []
        paths = glob.glob(self.dir+"/*.json")
        n = 0
        for path in paths:
            path = path.replace("\\", "/")
            if maxNum and n > maxNum:
                break
            #print path
            id = path[path.rfind("/")+1: -len(".json")]
            idn = int(id)
            if prevEndNum != None and idn <= prevEndNum:
                #print "rejecting %s < %s" % (idn, prevEndNum)
                continue
            #print id
            n += 1
            obj = json.load(file(path))
            coord = obj['coordinates']
            coord = coord['coordinates']
            mobj = {'id': id, 'lonlat': coord}
            objs.append(mobj)
        t1 = time.time()
        print "Got %d images in %.3fs" % (len(paths), t1-t0)
        return objs

if __name__ == '__main__':
    it = ImageTweets()
    it.saveJSON("../Viewer/data/imageTweets_data.json")
    #images = it.get()
    #print images

