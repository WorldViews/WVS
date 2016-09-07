
import os, sys, json
import urllib2
import requests
import feedparser
import codecs
import traceback
import time
import readGPX
import installLayers

SCRAPE_DIR = "../scraped_data"
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

def join(dir,child):
    path = os.path.join(dir,child)
    path = path.replace("\\", "/")
    return path

if 'WV_HOME' in os.environ:
    CONFIG_PATH = join(os.environ['WV_HOME'], "config/ADMIN_CONFIG.py")
else:
    CONFIG_PATH = "config/ADMIN_CONFIG.py"
print "Config path:", CONFIG_PATH
#if not os.path.exists(CONFIG_PATH):
#    CONFIG_PATH = "/home/flycam/config/twitter_auth_config.py"

config = {}
execfile(CONFIG_PATH, config)
ckey = config['ckey']
csecret = config['csecret']
atoken = config['atoken']
asecret = config['asecret']
GOOGLE_API_KEY = config['GOOGLE_API_KEY']


def getGeoGoogle(loc):
    """
    Takes a string that may describe a location and uses google maps API
    to try and find sensible lat and lon for that location.  Returns None
    if nothing found.
    """
    #loc = unidecode(loc)
    print "location:", loc
    qloc = urllib2.quote(loc)
    url0 = "https://maps.googleapis.com/maps/api/geocode/json?address=%(location)s&key=%(key)s"
    url = url0 % {'location': qloc,
                 'key': GOOGLE_API_KEY}
    print "url:", url
    uos = urllib2.urlopen(url)
    str = uos.read()
    ret = json.loads(str)
    #print json.dumps(ret, indent=3)
    if ret['status'] == "OK":
        res = ret['results']
        if len(res) == 0:
            print "*** no machting results ***"
            return None
        if len(res) > 1:
            print "*** ignoring multiple results ***"
        res = res[0]
        #print "res:", res
        geo = res['geometry']
        loc = geo['location']
        #bounds = geo['bounds']
        obj = {'lat': loc['lat'],
               'lon': loc['lng'],
               #'bounds': bounds,
               'address': res['formatted_address'],
               'query': loc}
    else:
        print "Cannot get geo information from google"
        print ret
        obj = None
    print obj
    return obj

def saveHtmlRecs(recs, opath):
    print "saveHtmlRecs saving to", opath
    obj = {'type': 'html',
           'records': recs,
           'numRecords': len(recs)}
    json.dump(obj, file(opath,"w"), indent=4)

def saveVideoRecs(vidrecs, opath):
    print "saveVideoRecs saving to", opath
    obj = {'type': 'robotTrail',
           'records': vidrecs,
           'numRecords': len(vidrecs)}
    json.dump(obj, file(opath,"w"), indent=4)

def saveAllRecs(htmlrecs, vidrecs, opath):
    print "saveAllRecs saving to", opath
    recs = htmlrecs + vidrecs
    obj = {'records': recs,
           'numRecords': len(recs)}
    json.dump(obj, file(opath,"w"), indent=4)


def openUrl(url,numTries):
    print "openUrl",url,numTries
    for i in range(numTries):
        try:
            uos = urllib2.urlopen(url)
            return uos
        except:
            traceback.print_exc()
            time.sleep(5)
            continue
    return None
            
def searchForMapLink(str,url):
    idx = str.find("https://www.google.com/maps/place/")
    if idx > 0:
        mapidx = str.find("/@",idx)
        endIdx = str.find("z", mapidx)
        locstr = str[mapidx+2:endIdx]
        parts = locstr.split(",")
        lat = float(parts[0])
        lon = float(parts[1])
        print "lat:", lat, "lon:", lon
        rec = {
                'lat': lat,
                'lon': lon,
                'url': url
               }
        return rec
        #recs.append(rec)
        #saveRecs(recs, opath)
    return None

def searchForEmbeddedMap(str,url):
    idx = str.find("ol.proj.transform")
    if idx > 0:
        imbedidx = str.find("([",idx)
        endIdx = str.find("],", imbedidx)
        locstr = str[imbedidx+2:endIdx]
        parts = locstr.split(",")
        lat = float(parts[0])
        lon = float(parts[1])
        print "lat:", lat, "lon:", lon
        rec = {
               'lat': lat,
               'lon': lon,
               'url': url
              }
        return rec
    return None

def tryGeoGoogle(title,url):
    geo = getGeoGoogle(title)
    if geo != None:
        print "geo:", geo
        rec = {'title': title,
               'lat': geo['lat'],
               'lon': geo['lon'],
               'url': url
              }
            
        return rec
    return None
    
def getYouTubeID(str):
    pat = "https://www.youtube.com/embed/"
    idx = str.find(pat)
    if idx > 0:
        endIdx = str.find("?", idx)
        youtubeID = str[idx+len(pat):endIdx]
        print "myID",youtubeID
        return youtubeID
    return None

def getGPX(str):
    """
    This function searches for a URL in the given
    string str that ends with .gpx.  If it finds it
    it returns that URL.  If not, it retuns None.

    THis function has a small bug, that if it finds
    one line with url: and http:// on one line and
    a .gpx in a later line, it will fail.
    """
    idx = str.find("url:")
    if idx > 0:
        gpxidx = str.find("http:",idx)
        if gpxidx < 0:
            return None
        endIdx = str.find(".gpx", gpxidx)
        if endIdx < 0:
            return None
        gpxstr = str[gpxidx:endIdx+len(".gpx")]
        if gpxstr.find("\n") >= 0:
            return None
        print "myUrl",gpxstr
        return gpxstr
    return None

def fixId(id):
    id = id.replace("?","_")
    id = id.replace("-","_")
    id = id.replace(":","_")
    id = id.replace("/","_")
    id = id.replace("=","_")
    id = id.replace(".", "_")
    id = id.replace(",", "_")
    return id

def scrapeBlog(feedUrl, htmlPath, vidPath=None, allPath=None, maxNumRecs = None):
    print "scrapeblog",feedUrl
    d = feedparser.parse(feedUrl)
    
    #d = feedparser.parse("https://gobeyondthefence.com/feed")
    #d = feedparser.parse("https://irishsea-mark-videos.blogspot.com/feeds/posts/default")
    print "n:", len(d.entries)
    recs = []
    vidrecs = []
    numErrors = 0
    badUrls = []
    for entry in d.entries:
        title = entry.title
        uid = fixId(entry['id'])
        print "title:", title
        print "uid:", uid
        #print entry.link
        url = entry.link
        print "url:", url
        uos = openUrl(url,5)
        if uos == None:
            print "******Failed to open url",url
            numErrors += 1
            badUrls.append(url)
            continue
        str = uos.read()
        rec = None
        rec = searchForMapLink(str,url)
        #first try to see if it has a maps link inserted
        if rec == None:
            rec = searchForEmbeddedMap(str,url)
        #if no map link inserted try to match Google geocode from title
        if rec == None:
            rec = tryGeoGoogle(title,url)
        #if it can't match geocode from title then rec equals none and we tried everything
        if rec == None:
            print "no location found"
            continue
        rec['title'] = title
        rec['id'] = uid
        recs.append(rec)
        if maxNumRecs and len(recs) > maxNumRecs:
            break
        if vidPath == None:
            continue
        #try to find gpx file in url
        youtubeId = getYouTubeID(str)
        gpxUrl = getGPX(str)
        if youtubeId == None or gpxUrl == None:
            continue
        print "gpxUrl:", gpxUrl
        obj, trailPath = readGPX.genIndex(gpxUrl)
        vidrec = {
            "id": "vid_tour_%s" % uid,
            "type": "robotTrail",
            "robotType": "wheelchair",
            "description": title,
            "tourName": "vid_tour_%s" % uid,
            "dataUrl": join("/static/data/paths", trailPath),
            "youtubeId": youtubeId,
            "youtubeDeltaT": 0,
            "coordSys": "GEO",
            "height": 0.3,
            }
        vidrecs.append(vidrec)

    if htmlPath:
        saveHtmlRecs(recs, htmlPath)
    if vidPath:
        saveVideoRecs(vidrecs, vidPath)
    if allPath:
        saveAllRecs(recs, vidrecs, allPath)
    print "vid path", vidPath
    print "All Path",allPath
    print "Done"
    print "Errors",numErrors
    print "bad urls",badUrls


def updateBlogLayers():
    scrapeBlog('http://gobeyondthefence.com/feed',
               join(SCRAPE_DIR, 'Enocks_Blog_data.json'),
               join(SCRAPE_DIR, 'Enocks_tours_data.json'),
               join(SCRAPE_DIR, 'Enocks_data.json'))

    scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default',
               join(SCRAPE_DIR, 'Marks_Blog_data.json'))

    installLayers.installAllLayers()


#scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default', 'Marks_Blog_data.json')
#scrapeBlog('https://gobeyondthefence.com/feed','Enocks_Blog_data.json')

if __name__ == '__main__':
    updateBlogLayers()


