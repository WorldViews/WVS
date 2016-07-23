
import time
import json


LAST_PRUNE_TIME = 0
PRUNING_INTERVAL = 5
MAX_UNHEARD_TIME = 20

ROOM_DB = {}

def pruneOldEntries():
    global LAST_PRUNE_TIME
    t = time.time()
    if t-LAST_PRUNE_TIME < PRUNING_INTERVAL:
        #print "** skipping pruning ***"
        return
    print "*** prunning ***"
    LAST_PRUNE_TIME = t
    maxUnheardTime = 10
    old = []
    for key in ROOM_DB:
        obj = ROOM_DB[key]
        if obj['lastTime'] < t-MAX_UNHEARD_TIME:
            old.append(key)
    for key in old:
        del ROOM_DB[key]



def getRoom(key):
    return ROOM_DB[key]

def regQuery(request, params, q):
    pruneOldEntries()
    ret = {'rooms': ROOM_DB.values()}
    #return json.dumps(ROOM_DB.values())
    return json.dumps(ret)

def regConnect(request, params, q):
    room = q.get("room", None)
    try:
        obj = ROOM_DB[room]
        jumpChatURL = "http://jumpchat.paldeploy.com/polly?room=%s" % room
        return jumpChatURL
    except:
        return None

def regRemove(request, params, q):
    room = q.get("room", None)
    if not room:
        return json.dumps([])
    try:
        del ROOM_DB[room]
    except:
        pass
    return json.dumps({'return_code': 0})

def reg_(request, params, q):
    global ROOM_DB
    room = q.get('room', "")
#    if room == '':
#        return regQuery(request, params, q)
    name = q.get('name', "")
    state = q.get("state", 0)
    lat = q.get("latitude", None)
    lon = q.get("longitude", None)
    maxUsers = q.get("maxUsers", 2)
    tagStr = q.get("tagStr", "")
    tags = tagStr.split()
    numUsers = q.get("numUsers", 0)
    clientType = q.get("clientType", "unknown")
    lastTime = time.time()
    print "name:", name
    print "numUsers:", numUsers
    obj = {'room': room, 'lastTime': lastTime, 'name': name,
           'tags': tags, 'clientType': clientType}
    #if state != '' and room != 'undefined':
    #    obj['state'] = state
    state = numUsers
    obj['state'] = state
    obj['numUsers'] = numUsers
    obj['maxUsers'] = maxUsers
    if lat:
        obj['latitude'] = lat
    if lon:
        obj['longitude'] = lon
    print "state:", state
    if room in ROOM_DB:
        oldObj = ROOM_DB[room]
        for key in obj:
            oldObj[key] = obj[key]
    else:
        obj['state'] = 1
        ROOM_DB[room] = obj
    return json.dumps(obj)

def reg(request, params):
    return reg_(request, params, request.GET)

def regp(request, params):
    if request.method == "POST":
        q = {"method": "POST"}
    else:
        q = {"method": request.method}
    postParams = request.GET
    return reg_(request, params, postParams)
    #q = request.POST
    #q = request.forms['params']
#   q = request.REQUEST
#   postParams = q.get("params", {})
    postParams = q
    return json.dumps(postParams)



