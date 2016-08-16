
import os, sys, json
import urllib2
import requests
import feedparser
import codecs
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

def scrapeBlog(feedUrl,opath):
    d = feedparser.parse(feedUrl)
    #d = feedparser.parse("https://gobeyondthefence.com/feed")
    #d = feedparser.parse("https://irishsea-mark-videos.blogspot.com/feeds/posts/default")
    print d.feed.title
    print "n:", len(d.entries)
    recs = []
    id = 0
    for entry in d.entries:
        title = entry.title
        print title
        #print entry.link
        url = entry.link
        print "url:", url
        uos = urllib2.urlopen(url)
        str = uos.read()
        idx = str.find("https://www.google.com/maps/place/")
        if idx > 0:
            id += 1
            idx2 = str.find("/@",idx)
            endIdx = str.find("z", idx2)
            locstr = str[idx2+2:endIdx]
            parts = locstr.split(",")
            lat = float(parts[0])
            lon = float(parts[1])
            print "lat:", lat, "lon:", lon
            rec = {'title': title,
                   'id': id,
                   'lat': lat,
                   'lon': lon,
                   'url': url
                  }
            recs.append(rec)
            saveRecs(recs, opath)
            continue
        # See if the post title is a location name
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
            recs.append(rec)
            saveRecs(recs, opath)
            continue
        # We've tried all the ways we know to guess
        # location...
        print "no location found"
        continue
    #saveRecs(recs, opath)
    print "Done"

    
<<<<<<< HEAD
scrapeBlog('https://gobeyondthefence.com/feed','Enocks_Blog_data.json')
#scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default', 'Marks_Blog_data.json')
=======
scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default', 'Marks_Blog_data.json')
#scrapeBlog('https://gobeyondthefence.com/feed','Enocks_Blog_data.json')
>>>>>>> origin/master


