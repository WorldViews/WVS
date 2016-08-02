
import json
import urllib2

class LocalWiki:
    def fetchRegions(self, opath="localWikiRegions_data.json",
                     maxNumRegions=None):
        id = 0
        url = "https://localwiki.org/api/v4/regions/?format=json"
        wvrecs = []
        while url:
            if maxNumRegions and id >= maxNumRegions:
                break
            print "Fetching from", url
            uos = urllib2.urlopen(url)
            buf = uos.read()
            obj = json.loads(buf)
            count = obj["count"]
            print "count:", count
            next = obj["next"]
            print "next:", next
            results = obj["results"]
            url = obj["next"]
            for res in results:
                name = res["full_name"]
                slug = res["slug"]
                apiUrl = res["url"]
                if not slug:
                    print "*** no slug for", name
                    continue
                htmlUrl = "https://localwiki.org/%s/" % slug
                try:
                    print "name:", name
                except:
                    print "*** Bad name"
                try:
                    coords = res["settings"]["region_center"]["coordinates"]
                except:
                    print "*** Unable to get coordinates"
                    continue
                id += 1
                #print "coords:", coords
                wvrec = {'id': "lwregion%d" % id,
                         'lat': coords[1],
                         'lon': coords[0],
                         'title': name,
                         'url': htmlUrl,
                         'apiUrl': url}
                wvrecs.append(wvrec)
                if maxNumRegions and id >= maxNumRegions:
                    break
	#print wvrec
        layer = {}
        layer["name"] = "LocalWiki Regions"
        layer["numRecords"] = len(wvrecs)
        layer["records"] = wvrecs
        json.dump(layer, file(opath, "w"), indent=4)


lw = LocalWiki()
lw.fetchRegions()
