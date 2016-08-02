
import json
#from LandOrSea import overLand
from LandOrSeaBaseline import overLand

def filterByLand(path, opath):
    obj = json.load(file(path))
    recs = obj['records']
    landRecs = []
    n = 0
    nLand = 0
    for rec in recs:
        n += 1
        lat = rec['lat']
        lon = rec['lon']
        if overLand(lat,lon):
            nLand += 1
            landRecs.append(rec)
        print nLand, n

    obj['records'] = landRecs
    json.dump(obj, file(opath, "w"), indent=4)
    print "Num Recs: %d   over land: %d\n" % (n, nLand)

#filterByLand("../Viewer/data/dancing_data.json", "../Viewer/data/dance_data.json")
#filterByLand("../Viewer/data/temples0_data.json", "../Viewer/data/temples_data.json")
#filterByLand("../Viewer/data/climbing0_data.json", "../Viewer/data/climbing_data.json")
#filterByLand("../Viewer/data/temples0_data.json", "../Viewer/data/temples_data.json")
#filterByLand("../Viewer/data/hiking0_data.json", "../Viewer/data/hiking_data.json")
filterByLand("../Viewer/data/gardens0_data.json", "../Viewer/data/gardens_data.json")
filterByLand("../Viewer/data/surfing0_data.json", "../Viewer/data/surfing_data.json")




