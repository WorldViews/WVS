
import slumber

api = slumber.API("https://localwiki.org/api/v4/")

print "-------------------------------------------------------"
#res = api.users.get(first_name="Don")
#res = api.users.get(first_name__istartswith="don")
#res = api.users.get(last_name="Kim")
res = api.users.get(last_name__startswith="Kim")
#print res
print "count:", res['count']
print "len(results):", len(res['results'])
for user in res['results']:
    print user['date_joined'], user['first_name'], user['last_name']

print "-------------------------------------------------------"
res = api.pages.get()
print "count:", res['count']
print "len(results):", len(res['results'])
for page in res['results']:
    for key in page.keys():
        print key
        print page[key]
        print
    print "--------"

"""
print "-------------------------------------------------------"

maps = api.maps.get()
print maps

print "-------------------------------------------------------"
sfmaps = api.maps.get(polys__contains=
                      {"type": "Point",
                       "coordinates": [ -122.44674682617188,
                                         37.76745803822967 ] })
print sfmaps
print "-------------------------------------------------------"
"""
