"""
This is an adapter for using MongoDB with WorldViews.

Note that when this inserts objects into mongoDB if
the object has an id field and no _id field, it sets
obj['_id'] = obj['id']
and when it returns an object having an _id field and
no id field, it sets
obj['id'] = obj['_id']

"""
import pymongo as pdb
import json, time, traceback
import jsonHack

TABLE_NAMES = ["chat", "notes", "periscope"]

class MDBAdapter:
    def __init__(self, host=None, port=None, dbName="wv_data"):
        self.client = pdb.MongoClient(host,port)
        self.dbName = dbName
        self.db = self.client[dbName]

    def getObj(self, id, tname):
        print "getObj", id, tname
        #obj = self.db[tname].find_one({'_id': id})
        obj = self.db[tname].find_one({'id': id})
        print "getObj:", obj
        return obj

    def getNote(self, id):
        return self.getObj(id, 'notes')

    def replaceObjToDB(self, obj, etype):
        print "add Obj to DB:", etype
        print "obj:", obj
        if etype not in TABLE_NAMES:
            print "**** addObjToDB: unknown table:", etype
            return
        #self.db[etype].insert_one(obj)
        #self.db[etype].replace_one({'_id': obj['_id']}, obj)
        self.db[etype].replace_one({'id': obj['id']}, obj)

    def addMsgStrToDB(self, msgStr, etype):
        print "add Msg to DB:", etype
        obj = json.loads(msgStr)
        self.addObjToDB(obj, etype)

    def addObjToDB(self, obj, etype):
        print "add Obj to DB:", etype
        """
        if 'id' in obj and '_id' not in obj:
            print "adding _id", obj['id']
            obj['_id'] = obj['id']
        """
        print "obj:", obj
        if etype not in TABLE_NAMES:
            print "**** addObjToDB: unknown table:", etype
            return
        self.db[etype].insert_one(obj)

    def query(self, etype, args, t):
        print "*** query", etype, args, t
        id = args.get("id", None)
        tMin = args.get("tMin", None)
        limit = args.get("limit", None)
        if limit != None:
            limit = int(limit)
        if tMin != None:
            tMin = float(tMin)
        try:
            table = self.db[etype]
            opts = {}
            if id != None:
                opts['id'] = id
            if tMin != None:
                opts['t'] = {"$gt": tMin}
            recs = table.find(opts)
            print "recs", recs
            if tMin != None:
                recs = recs.q = q.filter(rdb.row["t"].gt(tMin))
            recs = recs.sort('t', pdb.DESCENDING)
            if limit != None:
                recs = recs.limit(limit)
            recs = [r for r in recs]
            """
            for rec in recs:
                if '_id' in rec and 'id' not in rec:
                    rec['id'] = rec['_id']
            """
        except:
            traceback.print_exc()
            return {}
        items = list(recs)
        obj = {'type': etype,
               't' : t,
               'records': items}
        return obj



def test():
    dba = MDBAdapter()
    t = time.time()
    notes = dba.query('notes', {'limit': 5}, t)
    print jsonHack.dumps(notes, indent=4)
    print "--------------------------------"
    notes = dba.query('notes', {'limit': 2}, t)
    print jsonHack.dumps(notes, indent=4)

if __name__ == '__main__':
    test()
