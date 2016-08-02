
import os, sys, json, traceback
import urllib2
import YouTubeScraper as YTS
import codecs

#UTF8Writer = codecs.getwriter('utf8')
#sys.stdout = UTF8Writer(sys.stdout)

class TWDScraper:
    def __init__(self, yts=None):
        self.yts = yts
        self.cacheDir = "../scraperCache"
        self.recs = {}

    def getPage(self, n):
        cacheName = "twdPage%d.html" % n
        cachePath = "%s/%s" % (self.cacheDir, cacheName)
        if os.path.exists(cachePath):
            print "Using cache", cachePath
            return cachePath, file(cachePath).read()
        url = "http://travelwithdrone.com/aerial-database/page/%d/" % n
        uos = urllib2.urlopen(url)
        buf = uos.read()
        print "Caching to", cachePath
        file(cachePath, "w").write(buf)
        return cachePath, buf

    def processRange(self, low=2, high=790, maxNumObjs=None):
        numObjs = 0
        for n in range(low,high+1):
            cachePath, buf = self.getPage(n)
            #parts = buf.split("\"")
            parts = buf.split("\r")
            print "bufsize:", len(buf)
            print "num parts:", len(parts)
            n = 0
            obj = {}
            for part in parts:
                n += 1
                #print "n:", n, part
                #if part.find("https://www.youtube.com/embed") >= 0 or part.find("vimeo") >= 0:
                #if part.find("youtube.com/embed") >= 0 
                if part.find("youtube.com/embed") >= 0 or \
                   part.find("//www.dailymotion.com/embed") >= 0 or \
                   part.find("vimeo") >= 0:
                    i = part.find("//")
                    url = part[i:]
                    i = url.find("\"")
                    if i < 0:
                        print "***** Skipping ill formed URL"
                        continue
                    url = url[:i]
                    print "url:", url
                    obj['url'] = url
                i = part.find("Location:")
                if i >= 0:
                    part = part[i+len("Location:"):]
                    j = part.find("</p>")
                    if j < 0:
                        print "Unexpected location string"
                        continue
                    locString = part[:j]
                    print "location:", locString
                    obj['location'] = locString
                i = part.find("ratingValue")
                if i >= 0:
                    part = part[i+len('ratingValue">'):]
                    i = part.find("<")
                    ratingValue = part[:i]
                    print "rating:", ratingValue
                    obj['ratingValue'] = float(ratingValue)
                i = part.find("ratingCount")
                if i >= 0:
                    part = part[i+len('ratingCount">'):]
                    i = part.find("<")
                    ratingCount = part[:i]
                    obj['ratingCount'] = int(ratingCount)
                    obj['cachePath'] = cachePath
                    self.handleFinishedObj(obj)
                    numObjs += 1
                    obj = {}
                if maxNumObjs and numObjs > maxNumObjs:
                    return
            print "n:", n

    def handleFinishedObj(self, obj):
        print "handleFinishObj", obj
        url = obj['url']
        i = url.rfind("/")
        id = url[i+1:]
        i = id.find("?")
        if i >= 0:
            id = id[:i]
        obj['id'] = id
        vtype = None
        for type in ["vimeo", "youtube", "dailymotion"]:
            if url.find(type) >= 0:
                vtype = type
        if vtype:
            obj['type'] = vtype
        else:
            print "**** No video type for ", obj
        self.recs[url] = obj
        print "obj:", obj
        self.tryToAddGeo(obj)

    def tryToAddGeo(self, obj):
        yts = self.yts
        id = obj['id']
        if obj['type'] == "youtube" and yts:
            yts.processIds(id)
            if id not in yts.recs:
                print "*** no loc info for", id
                return
            rec = yts.recs[id]
            print "rec:", rec
            if 'lat' in rec:
                obj['lat'] = rec['lat']
                obj['lon'] = rec['lon']
                obj['title'] = rec['title']
        else:
            return
        self.dump("TWD_WITH_LOC.json", True)
        #self.dump("TWD_WITH_LOC.json")

    def dump(self, opath=None, withLocOnly=False):
        recs = self.recs.values()
        if withLocOnly:
            recs0 = []
            for rec in recs:
                if 'lat' in rec:
                    recs0.append(rec)
            recs = recs0
        obj = {'records': recs,
               'numRecords': len(recs)}
        #print json.dumps(obj, indent=4)
        if opath:
            json.dump(obj, file(opath,"w"), indent=4)

def run():
    yts = YTS.YouTubeScraper(False)
    twd = TWDScraper(yts)
    #twd.processRange(2,500)
    twd.processRange()
    print "-------------------------"
    twd.dump("TWD_OBJS2.json")
    #twd.dump("TWD_OBJS.json")

if __name__ == '__main__':
    try:
        run()
    except:
        traceback.print_exc()
        input("type any key")

