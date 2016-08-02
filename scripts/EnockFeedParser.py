
import sys
import urllib2
import requests
import feedparser
import codecs
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

d = feedparser.parse("https://gobeyondthefence.com/feed")
#d = feedparser.parse("https://irishsea-mark-videos.blogspot.com/feeds/posts/default")
print d.feed.title
print "n:", len(d.entries)
for entry in d.entries:
    print entry.title
    #print entry.link
    url = entry.link
    print "url:", url
    uos = urllib2.urlopen(url)
    str = uos.read()
    idx = str.find("https://www.google.com/maps/place/")
    print "idx:", idx
    if idx > 0:
        idx2 = str.find("/@",idx)
        endIdx = str.find("z", idx2)
        locstr = str[idx2+2:endIdx]
        print "locstr:", locstr
        parts = locstr.split(",")
        lat = float(parts[0])
        lon = float(parts[1])
        print "lat:", lat, "lon:", lon
    else:
        print "no location found"
#    rep = requests.get(url)
#    str = rep.html()
    """
    print "len(str):", len(str)
    print "comments:", entry.comments
    print "type(entry):", type(entry)
    print "keys(entry):", entry.keys()
    #print "entry:\n", entry
    """
    print


