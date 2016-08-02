
import os, urllib2
import json

def verifyDir(path):
    if not os.path.exists(path):
        print "Creating", path
        os.makedirs(path)

class TravelByDrone:
    def __init__(self):
        self.dataDir = "TBD_data"
        verifyDir(self.dataDir)

    def parseHTMLForOpenVideo(self, path):
        buf = open(path).read()
        chunks = []
        while 1:
            i = buf.find("openVideo(")
            if i < 0:
                break
            buf = buf[i+len("openVideo("):]
            chunk = buf[:buf.find(")")]
            chunk = chunk.replace("'", "")
            parts = chunk.split(",")
            id = parts[0]
            try:
                lat = float(parts[1])
                lon = float(parts[2])
            except:
                continue
            spec = id, lat, lon
            #print spec
            chunks.append([id, lat, lon])
        return chunks

    def getHTML(self, id):
        dataPath = "%s/%s.html" % (self.dataDir, id)
        if os.path.exists(dataPath):
            print "Reading from", dataPath
            buf = file(dataPath).read()
        else:
            url = "http://travelbydrone.com/drone/viewVideo/%s" % id
            print "Fetching from", url
            uos = urllib2.urlopen(url)
            buf = uos.read()
            dataPath = "%s/%s.html" % (self.dataDir, id)
            file(dataPath, "w").write(buf)
        return buf

    def getYahooId(self, id):
        print "====================="
        buf = self.getHTML(id)
        prefix = "//www.youtube.com/embed/"
        i = buf.find(prefix)
        if i < 0:
            print "Not yahooId not found"
            return None
        str = buf[i+len(prefix):]
        j = str.find("?")
        yahooId  = str[:j]
        print "yahooId:", yahooId
        print "---------------------"
        return yahooId

    def getData(self):
        specs = self.parseHTMLForOpenVideo("travelByDronesSample.html")
        objs = []
        for spec in specs:
            id, lat, lon = spec
            print id, lat, lon
            obj = {'id': id, 'lat': lat, 'lon': lon}
            yahooId = self.getYahooId(id)
            if yahooId:
                obj['yahooId'] = yahooId
            objs.append(obj)
        f = file("TBD_data.json", "w")
        json.dump(objs, f, indent=4, sort_keys=True);
        return objs


if __name__ == '__main__':
    tbd = TravelByDrone()
    tbd.getData()
    #tbd.parseHTMLForOpenVideo("travelByDronesSample.html")
    """
    tbd.get(19500)
    tbd.get(19501)
    tbd.get(19540)
    tbd.get(19541)
    tbd.get(19542)
    """

