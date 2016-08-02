
from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import json

"""
You can get these at twitter developer website https://dev.twitter.com/
"""
ckey = 'BTM3YIkdlGbrZOlzeTcuvUdkW'
csecret = '56b3f7mZ8tItaEKwRvn2GrQzyAqN2XqOeYTjiMjadmVpeEdiVD'
atoken = '26191554-8A2QGfet0VcNIPFco1rMoh0fXwHJDYdWKPiJiKcv9'
asecret = 'VWfyYnUsoD6dX96zfN8edb80DzVf9Hk2Y7Ka2jpSqRGxv'

class listener(StreamListener):

    def on_data(self, data):
        #print data
        obj = json.loads(data)
        text = obj['text']
        try:
            print "text:", text
        except:
            print "text: ******"
        if "geo" in obj:
            geo = obj['geo']
            if geo:
                print "geo", geo
        try:
            ents = obj['entities']
            media = ents['media']
            for med in media:
                if 'media_url' in med:
                    print " ", med['media_url']
        except KeyError:
            pass
        print
        return True

    def on_error(self, status):
        print "on_error:"
        print status

auth = OAuthHandler(ckey, csecret)
auth.set_access_token(atoken, asecret)
twitterStream = Stream(auth, listener())
twitterStream.filter(track=["boat"])

