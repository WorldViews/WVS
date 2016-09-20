
import json, time

from craigslist import CraigslistHousing, CraigslistEvents
from craigslist import get_all_sites

print "sites:", get_all_sites()

#DEFAULT_OUTPUT_PATH = "../Viewer/data/craigslist_data.json"
DEFAULT_OUTPUT_PATH = "craigslist_data.json"

class CLWatcher:
    def __init__(self, site="sfbay", autoSave=True, limit=500):
        self.recs = []
        self.site = site
        self.limit = limit
        self.autoSave = autoSave

    def setSite(self, site):
        self.site = site

    def save(self, path=None):
        if path == None:
            path = DEFAULT_OUTPUT_PATH
        print "Saving to", path
        t0 = time.time()
        obj = {'type': 'craigslist',
               't': time.time(),
               'records': self.recs
               }
        json.dump(obj, file(path, 'w'), indent=3, sort_keys=True)
        t1 = time.time()
        print "Saved %d recs in %.3fsec" % (len(self.recs), t1-t0)
        
    def getHousingPosts(self, limit=None):
        site = self.site
        if limit == None:
            limit = self.limit
        #cl_h = CraigslistHousing(site=site, area='sfc', category='roo',
        cl_h = CraigslistHousing(site=site, category='roo',
                                 filters={'max_price': 1200, 'private_room': True})
        for result in cl_h.get_results(sort_by='newest', limit=limit, geotagged=True):
            #print result
            if 'geotag' not in result:
                print "***** Missing geotag"
                continue
            rec = dict(result)
            rec['recType'] = 'housing'
            self.recs.append(rec)
        if self.autoSave:
            self.save()

    def getEvents(self, limit=None):
        site = self.site
        if limit == None:
            limit = self.limit
        #cl_e = CraigslistEvents(site=site, filters={'free': True, 'food': True})
        cl_e = CraigslistEvents(site=site, filters={'free': True})
        for result in cl_e.get_results(sort_by='newest', limit=limit, geotagged=True):
            #print result
            if 'geotag' not in result or result['geotag'] == None:
                print "***** Missing geotag"
                continue
            rec = dict(result)
            rec['recType'] = 'event'
            self.recs.append(rec)
        if self.autoSave:
            self.save()


def run():
    sites = get_all_sites()
    try:
        sites.remove("newyork")
        sites.remove("chicago")
    except:
        pass
    cl = CLWatcher()
    print "Sites:", sites
    for site in sites:
        print "Processing for", site
        cl.setSite(site)
        cl.getHousingPosts()
        cl.getEvents()
        cl.save()

if __name__ == '__main__':
    run()
