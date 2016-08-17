
import sys
import urllib2
import requests
import feedparser
import codecs
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

#d = feedparser.parse("http://www.gobeyondthefence.com/feed/")
d = feedparser.parse("https://irishsea-mark-videos.blogspot.com/feeds/posts/default")
print d.feed.title
print "n:", len(d.entries)
for entry in d.entries:
    print entry.title
    #print entry.link
    url = entry.link
    print "url:", url
    uos = urllib2.urlopen(url)
    str = uos.read()
    idx = str.find("location [")
    if idx > 0:
        idx2 = str.find("]",idx)
        locstr = str[idx+10:idx2]
        parts = locstr.split()
        lat = float(parts[1])
        lon = float(parts[3])
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


