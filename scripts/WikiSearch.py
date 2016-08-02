
import sys
import requests
import json
import codecs

UTF8Writer = codecs.getwriter('utf8')
sys.stdout = UTF8Writer(sys.stdout)

"""
https://en.wikipedia.org/w/api.php
?action=query&prop=coordinates&titles=Wikimedia%20Foundation&coprop=type%7Cname%7Cdim%7Ccountry%7Cregion&coprimary=all
"""

def getGeo(title):
    d = {
        'action': 'query',
        'prop': 'coordinates',
        'titles': title,
        'coprimary': 'primary',
        'format': 'json'
    }
    rep = requests.get("https://en.wikipedia.org/w/api.php", params=d)
    #print rep.status_code
    obj = rep.json()
    pages = obj['query']['pages']
    for id in pages:
        page = pages[id]
        if 'coordinates' not in page:
            #print "No coordinates"
            return None
        coords = page['coordinates']
        coords = coords[0]
        #print coords
        return coords


def saveRecs(recs, opath):
    layer = {'type': 'Wikipedia',
             'numRecs': len(recs),
             'records': recs}
    file(opath,'w').write(json.dumps(layer, indent=4))


def getItems(sterm, maxNum=None, opath="wiki.json"):
    d = {
        'action': 'query',
        'list': 'search',
        'srsearch': sterm,
        'format': 'json',
        'srlimit': 50,
    }
    goodRecs = []
    numGood = 0
    id = 0
    while True:
        rep = requests.get("https://en.wikipedia.org/w/api.php", params=d)
        #print rep.status_code
        obj = rep.json()
        #print json.dumps(obj, indent=4)
        print obj["query"]["searchinfo"]
        items = obj['query']['search']
        for item in items:
            #print item
            title = item['title']
            coords = getGeo(title)
            if not coords:
            #print "Skipping page with no coordinates"
                continue
            print title, coords
            print
            url = "https://en.wikipedia.org/wiki/" + title
            url = url.replace(" ", "_")
            id += 1
            print id, title
            rec = {'title': title,
                   'url': url,
                   'id': 'wiki_%d' % id,
                   'lat': coords['lat'],
                   'lon': coords['lon']}
            goodRecs.append(rec)
            numGood = len(goodRecs)
            if maxNum and numGood >= maxNum:
                break
            if numGood % 50 == 0 and numGood > 0:
                saveRecs(goodRecs, opath)
        if maxNum and numGood >= maxNum:
            break
        try:
            cont = obj['continue']
            print "cont:", cont
            if cont['sroffset']:
                print "sroffset:", cont['sroffset']
                d['sroffset'] = cont['sroffset']
                continue
            break
        except:
            print "No continue"
            break
    print "Num Recs:", len(goodRecs)
    print goodRecs
    saveRecs(goodRecs, opath)



#getItems("lake", maxNum=250)
getItems("museum", maxNum=3000, opath="wiki_museum_data.json")



