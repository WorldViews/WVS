
import sys, json
import urllib2
import requests
import feedparser
import codecs
UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)


def scrapeBlog(feedUrl,opath):
    d = feedparser.parse(feedUrl)
    #d = feedparser.parse("https://gobeyondthefence.com/feed")
    #d = feedparser.parse("https://irishsea-mark-videos.blogspot.com/feeds/posts/default")
    print d.feed.title
    print "n:", len(d.entries)
    recs = []
    id = 0
    for entry in d.entries:
        print entry.title
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
            title = entry.title
            print "lat:", lat, "lon:", lon
            rec = {'title': title,
                   'id': id,
                   'lat': lat,
                   'lon': lon,
                   'url': url
                  }
        else:
            print "no location found"
            continue
        recs.append(rec)
    obj = {'type': 'html',
           'records': recs,
           'numRecords': len(recs)}
    if opath:
        json.dump(obj, file(opath,"w"), indent=4)

    #    rep = requests.get(url)
    #    str = rep.html()
        """
        print "len(str):", len(str)
        print "comments:", entry.comments
        print "type(entry):", type(entry)
        print "keys(entry):", entry.keys()
        #print "entry:\n", entry
        """
    print "I'm done now"
    
scrapeBlog('https://gobeyondthefence.com/feed','Enocks_Blog_data.json')
scrapeBlog('https://irishsea-mark-videos.blogspot.com/feeds/posts/default', 'Marks_Blog_data.json')


