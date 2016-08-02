from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import os, urllib2, json
import ImageResizer

#IMAGE_DIR = "C:/kimber/WorldViews/twitter_images"
IMAGE_DIR = "../images/twitter_images"
CONFIG_PATH = "C:/kimber/WorldViews/twitter_auth_config.py"
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
    

class listener(StreamListener):
    n = 0

    def on_data(self, data):
        #print data
        obj = json.loads(data)
        if "geo" not in obj:
            return True
        text = obj.get('text', None)
        geo = obj.get('geo', None)
        media_urls = []
        try:
            ents = obj['entities']
            media = ents['media']
            for med in media:
                if 'media_url' in med:
                    media_urls.append(med['media_url'])
        except KeyError:
            pass
        if geo and media_urls:
            try:
                print "text", text
            except:
                print "text ****"
            print "geo", geo
            print "media_urls", media_urls
            self.n += 1
            url = media_urls[0]
            id = "%07d" % self.n
            path = saveImage(url, id)
            if path:
                jsonPath = "%s/%s.json" % (IMAGE_DIR, id)
                json.dump(obj, file(jsonPath, "w"))
            print
        return True

    def on_error(self, status):
        print "on_error:"
        print status

def verifyDir(path):
    if not os.path.exists(path):
        print "Creating", path
        os.makedirs(path)
        

class TwitterWatcher:
    def __init__(self):
        auth = OAuthHandler(ckey, csecret)
        auth.set_access_token(atoken, asecret)
        self.twitterStream = Stream(auth, listener())
        verifyDir(IMAGE_DIR)

    def run(self):
        self.twitterStream.filter(locations=[-180.0, -90.0, 180.0, 90.0])


def run():
    tw = TwitterWatcher()
    tw.run()

if __name__ == '__main__':
    run()

