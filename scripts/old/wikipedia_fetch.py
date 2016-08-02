import urllib2
import json
import requests

"""
 def fetchPlaces():
     id = 0
     url = "https://en.wikipedia.org/wiki/Geographic_coordinate_system"
     uos = urllib2.urlopen(url)
     buf = uos.read()
     obj = json.loads(buf)
     count = obj["count"]
     print "count:", count
     next = obj["next"]
     print "next:", next
     results = obj["results"]
     wvrecs = []
     for res in results:
         name = res["title"]
	 try:
	     print "name:", name, "  url:", url
	 except:
             print "Bad name"
	     continue
	 url = res["url"]
	 try:
	     coords = res["conditions"]["nodes"]["coordinates"] I am sure I need to change this line but not sure to what
	 except:
             print "Unable to get coordinates"
	     continue
	 id += 1
	 print "coords:", coords
	 print
         wvrec = {'id': "%d" % id,
		  'lat': coords[1],
		  'lon': coords[0], should my_atts from below go here?
		  'title': name,
		  'url': url}
 wvrecs.append(wvrec)
 print wvrec
     #print "wvrecs", wvrecs
 layer = {}
 layer["name"] = "Wikipedia Entries"
 layer["records"] = wvrecs
 print layer

 I am unsure how to go from what's below to get it to work like what is above.  Also I am unable to put in multiple search points so I am not sure how I might get more pages. 
When I change my_atts['list'] = 'geosearch'  to my_atts['list'] = 'records' the script sends back this:
 {
     "batchcomplete": "", 
     "warnings": {
        "query": {
             "*": "Unrecognized value for parameter 'list': records"
         }, 
         "main": {
             "*": "Unrecognized parameters: 'gscoord', 'gslimit', 'gsradius', 'gsprimary'"
         }
    }
o }
"""
def getStuff():
    id = 0
    baseurl = 'http://en.wikipedia.org/w/api.php'
    my_atts = {}
    my_atts['action'] = 'query'  # action=query
    my_atts['list'] = 'geosearch'     # prop=info
    my_atts['gscoord'] = '37.4061498|-122.1508337'
    my_atts['gsradius'] = '10000' 
    my_atts['gsprimary'] = 'primary' 
    my_atts['gslimit'] = '500' 
    my_atts['format'] = 'json'   # format=json

    resp = requests.get(baseurl, params = my_atts)
    data = resp.json()
    v = data["query"]
    lst = data["query"]["geosearch"]
    results = []
    for entry in lst:
        id += 1
        t = entry["title"]
        lat = entry["lat"]
        lon = entry["lon"]
        url = "https://en.wikipedia.org/wiki/" + t
        url = url.replace(" ", "_")
        d = {}
        d["url"] = url
        d["lat"] = lat
        d["lon"] = lon
        d["title"] = t
        d["id"] = id
        results.append(d)
        try:
            print d
        except:
            continue
    print
    #print results
    res = {}
    res["records"] = results
    res["name"] = "WikiLocation"
    res["numRecords"] = len(results)
    print
    print res
    json.dump(res, file("wikipedia_data.json", "w"), indent=4)


getStuff()


