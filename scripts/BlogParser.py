
import os, sys, json
import urllib2
import requests
import feedparser
import codecs
import traceback
import time
from readGPX import genIndex
from readGPX import gpxpy

UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)


if 'WV_HOME' in os.environ:
    CONFIG_PATH = os.path.join(os.environ['WV_HOME'], "config/ADMIN_CONFIG.py")
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

def saveRecs(recs, opath):
    obj = {'type': 'html',
           'records': recs,
           'numRecords': len(recs)}
    if opath:
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
        idx2 = str.find("/@",idx)
        endIdx = str.find("z", idx2)
        locstr = str[idx2+2:endIdx]
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

def searchForImbeddedMap(str,url):
    idx = str.find("ol.proj.transform")
    if idx > 0:
        idx4 = str.find("([",idx)
        endIdx = str.find("],", idx4)
        locstr = str[idx4+2:endIdx]
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
        id += 1
        print "geo:", geo
        rec = {'title': title,
               'id': id,
               'lat': geo['lat'],
               'lon': geo['lon'],
               'url': url
              }
            
        return rec
    return None

def scrapeBlog(feedUrl,opath):
    print "scrapeblog",feedUrl
    d = feedparser.parse(feedUrl)
    
    #d = feedparser.parse("https://gobeyondthefence.com/feed")
    #d = feedparser.parse("https://irishsea-mark-videos.blogspot.com/feeds/posts/default")
    print "n:", len(d.entries)
    recs = []
    id = 0
    numErrors = 0
    badUrls = []
    for entry in d.entries:
        title = entry.title
        print title
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
            rec = searchForImbeddedMap(str,url)
        if rec == None:
            rec = tryGeoGoogle(title,url)
        if rec == None:
            continue
        #if it doesn't have a map link inserted then try to look for open street map
        
        #try to find gpx file in url
        
        #try to find gpx file in url
        idx5 = str.find("url:")
        if idx5 > 0:
            id += 1
            idx6 = str.find("http:",idx5)
            endIdx = str.find(",", idx6)
            gpxstr = str[idx6+5:endIdx]
            print "myUrl",gpxstr
            continue
        # See if the post title is a location name
        
        # We've tried all the ways we know to guess
        # location...
        print "no location found"
        continue
    #saveRecs(recs, opath)
    print "Done"
    print "Errors",numErrors
    print "bad urls",badUrls
    

scrapeBlog('http://gobeyondthefence.com/feed','Enocks_Blog_data.json')
#scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default', 'Marks_Blog_data.json')

#scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default', 'Marks_Blog_data.json')
#scrapeBlog('https://gobeyondthefence.com/feed','Enocks_Blog_data.json')



