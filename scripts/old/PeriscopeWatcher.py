import tweepy
from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import os, urllib2, json, traceback
import ImageResizer
import codecs
import sys, os
API = None
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)
ofile = UTF8Writer(file("pw.txt", "w"))

#IMAGE_DIR = "C:/kimber/WorldViews/twitter_images"
IMAGE_DIR = "../images/twitter_images"
CONFIG_PATH = "C:/kimber/WorldViews/twitter_auth_config.py"
if not os.path.exists(CONFIG_PATH):
    CONFIG_PATH = "/home/flycam/config/twitter_auth_config.py"
"""
You can get authentication values at twitter developer website https://dev.twitter.com/
"""
config = {}
execfile(CONFIG_PATH, config)
ckey = config['ckey']
csecret = config['csecret']
atoken = config['atoken']
asecret = config['asecret']

print "ckey", ckey
print "csecret", csecret

    
def saveImage(url, id):
    path = "%s/%s.jpg" % (IMAGE_DIR, id)
    pow2path = "%s/%s_p2.jpg" % (IMAGE_DIR, id)
    print "Saving to", path
    try:
        uos = urllib2.urlopen(url)
    except:
        print "Couldn't open", url
        return None
    try:
        file(path, "wb").write(uos.read())
    except:
        print "Couldn't save", path
        return None
    ImageResizer.resizePow2(path, pow2path)
    return path
    
def lookup(id):
    print "---------------------------------"
    statuses = API.statuses_lookup([id])
    s = statuses[0]
    print "geo:", s.geo
    print "created_at:", s.created_at
    print "place:", s.place
    #print "user:", s.user
    print "coordinates:", s.coordinates
    #print "ent:", s.entities
    urls = s.entities['urls']
    #print "urls", urls
    print "---------------------------------"
    return s

class listener(StreamListener):
    n = 0
    k = 0
    def on_data(self, data):
        try:
            return self.on_data_(data)
        except:
            traceback.print_exc()
            return True

    def on_data_(self, data):
        self.k += 1
        print "n:", self.k
        obj = json.loads(data)
        #print json.dumps(obj, indent=3, sort_keys=True)
        #file("peri_%d.json" % self.k, "w").write(
        #    json.dumps(obj, indent=3, sort_keys=True))
        #print "place: ", obj.get("place", None)
        text = obj.get('text', None)
        place = obj.get('place', None)
        geo = obj.get('geo', None)
        bbox = None
        try:
            bbox = place["bounding_box"]["coordinates"]
        except:
            print "cannot get bbox"
        media_urls = []
        urls = []
        hashtags = None
        id = None
        try:
            id = obj.get("id", None)
            ents = obj['entities']
            hashtags = ents.get("hashtags")
            hashtags = [o['text'] for o in hashtags]
            urls = ents['urls']
            media = ents['media']
            for med in media:
                if 'media_url' in med:
                    media_urls.append(med['media_url'])
        except KeyError:
            pass
        if not hashtags:
            #print "Skipping record with no hashtags"
            return True
        if 'Periscope' not in hashtags:
            print "Skipping rec with no Periscope"
            return True
        periscope_url = None
        display_url = None
        for url in urls:
            if url['expanded_url'].find("periscope") >= 0:
                periscope_url = url['expanded_url']
            display_url = url['display_url']
        print "id:", id
        print "periscope_url:", periscope_url
        print "hashtags:", hashtags
        print "urls:", urls
        print "bbox:", bbox
        print "text:", text
        #if id:
        #    lobj = lookup(int(id))
        jobj = {'text': text, 'expanded_url': periscope_url,
                'display_url': display_url, 'fullObj': obj}
        json.dump(jobj, ofile, indent=3, sort_keys=True)
        ofile.flush()
        if place == None and geo == None:
            print "skipping rec with no place"
            return True
        print "*************************** BINGO\07 ****************"
        self.n += 1
        id = "%07d" % self.n
        jsonPath = "peri_%s.json" % id
        json.dump(obj, file(jsonPath, "w"), indent=3, sort_keys=True)
        return True
        """
        if geo and media_urls:
            try:
                print "text", text
            except:
                print "text ****"
            print "geo", geo
            print "media_urls", media_urls
            url = media_urls[0]
            path = saveImage(url, id)
            if path:
            print
        return True
        """

    def on_error(self, status):
        print "on_error:"
        print status

def verifyDir(path):
    if not os.path.exists(path):
        print "Creating", path
        os.makedirs(path)
        

class TwitterWatcher:
    def __init__(self):
        global API
        auth = OAuthHandler(ckey, csecret)
        auth.set_access_token(atoken, asecret)
        self.twitterStream = Stream(auth, listener())
        API = tweepy.API(auth)
        verifyDir(IMAGE_DIR)

    def run(self):
        pattern = ["#Periscope"]
        #pattern = ["find:periscope"]
        #pattern = ["Periscope"]
        #pattern = ["#Periscope geocode:39.8,-95.583068847656,2500km"]
        print "filter: pattern: ", pattern
        #self.twitterStream.filter(locations=[-180.0, -90.0, 180.0, 90.0],
        #                          track=pattern)
        self.twitterStream.filter(track=pattern)



def run():
    tw = TwitterWatcher()
    tw.run()

if __name__ == '__main__':
    run()

