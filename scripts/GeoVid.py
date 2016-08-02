
import sys, json
import requests
import codecs

GEOVID_PREFIX = "http://api.geovid.org/v1.0"


def search(lat0, lat1, lon0, lon1, opath="geovid_data.json"):
    url = "%s/search/region_query/%f/%f/%f/%f" % \
       (GEOVID_PREFIX, lat0, lon0, lat1, lon1)
    print url
    ret = requests.get(url)
    obj = ret.json()
    #json.dump(obj, file("geovidRecs.json","w"), indent=4)
    results = obj['results']
    print len(results)
    recs = []
    i = 0
    for res in results:
        i += 1
        #print res
        vidId = res[0]
        url = "http://api.geovid.org/v1.0/gv/video/%s" % vidId
        rec = {
            "id":        "gv%d" % i,
            "url":       url,
            "vidId":     vidId,
            "startTime": res[1],
            "endTime":   res[2],
            "dur":       res[3],
            "lat":       res[4],
            "lon":       res[5],
            "t0":        res[8],
        }
        recs.append(rec)
    obj = {'type': 'geovid',
           'records': recs,
           'numRecords': len(recs)}
    if opath:
        json.dump(obj, file(opath,"w"), indent=4)


if __name__ == '__main__':
#    search(1.28326, 1.29106, 103.84921, 103.86016)
    search(-90, 90, -180, 180)

