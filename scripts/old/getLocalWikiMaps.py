
import json
import urllib2

def fetchMaps():
    url = "https://localwiki.org/api/v4/maps/?format=json"
    uos = urllib2.urlopen(url)
    buf = uos.read()
    obj = json.loads(buf)
    count = obj["count"]
    print "count:", count
    next = obj["next"]
    print "next:", next
    results = obj["results"]
    for res in results:
        url = res["url"]
	print url
	if "points" in res and res["points"]:
            points = res["points"]
	    #print "points:", points
	    if "coordinates" in res["points"]:
                coords = res["points"]["coordinates"]
                #print "coords:", coords
		pt1 = coords[0]
		print "pt1:", pt1
	    else:
                print "No coordinates"
	else:
            print "No points for this res"

fetchMaps()
