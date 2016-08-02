import tweepy
from tweepy import Stream
from tweepy import OAuthHandler
#from tweepy.streaming import StreamListener
import os, urllib2, json
import ImageResizer
import codecs
import sys 
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

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

auth = tweepy.OAuthHandler(ckey, csecret)
auth.set_access_token(atoken, asecret)
api = tweepy.API(auth)

"""

def lookup(ids):
    statuses = api.statuses_lookup(ids)
    for s in statuses:
        #print s
        print dir(s)
        print "place:", s.place
        print "user:", s.user
        print "ent:", s.entities
        urls = s.entities['urls']
        print "urls", urls

#lookup([4911146794])
"""

"""
print "***** try the query *****"
for tweet in tweepy.Cursor(api.search,q='filter:periscope',
                           count=6,
                           since='2016-05-15').items():
        print tweet
        print tweet.json
        #print tweet.place
        print "place:", tweet.place
        #print tweet["place"]
"""

def lookup(ids):
    statuses = api.statuses_lookup(ids)
    for s in statuses:
        #print s
        print dir(s)
        print "place:", s.place
        print "user:", s.user
        print "ent:", s.entities
        urls = s.entities['urls']
        print "urls", urls

#lookup([4911146794])
lookup([732365311756754944])

print "done"

