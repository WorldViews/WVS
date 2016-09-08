"""
This has a few simple scripts for backing up
or restoring tables to/from JSON files.
"""
import os
from distutils.dir_util import mkpath
import json
import pymongo as pdb

DB_NAME = "test"
TABLES = ["periscope", "notes", "chat", "periscope_admin"]

def verifyDir(path):
    if not os.path.exists(path):
        print "Creating dirs for", path
        mkpath(path)

def nyi():
    raise "NotYetImplemented"

class MongoDB_Admin:
    def __init__(self, dbName=None):
        self.client = pdb.MongoClient()
        if dbName:
            self.db = self.client[dbName]

    def dbNames(self):
        return self.client.database_names()

    def dumpInfo(self):
        dbNames = self.dbNames()
        for name in dbNames:
            print name
            self.dumpDB(name)

    def dumpDB(self, name):
        print "---------------------------------"
        print "DB", name
        db = self.client[name]
        for name in db.collection_names():
            print name
            self.dumpTable(name, db)

    def dumpTable(self, name, db=None):
        if db == None:
            db = self.db
        col = db[name]
        for item in col.find():
            print item

    def createTable(self, tname):
        self.db.create_collection(tname)

    def create(self, tables=TABLES):
        for tname in tables:
            self.createTable(tname)

    def deleteTable(self, tname):
        self.db.drop_collection(tname)

    def delete(self, tables=TABLES):
        for tname in tables:
            self.deleteTable(tname)

    def backupTable(self, tname, jsonPath=None):
        obj = {'table': tname}
        recs = self.db[tname].find()
        recs = [r for r in recs]
        obj['records'] = recs
        if jsonPath:
            print "Saving %s to %s" % (tname, jsonPath)
            f = open(jsonPath, "w")
            f.write(json.dumps(obj, indent=3, sort_keys=True))
        return obj

    def backup(self, dir=None, tables=TABLES):
        if dir:
            verifyDir(dir)
        for tname in tables:
            jsonPath = None
            if dir:
                jsonPath = "%s/%s_dump.json" % (dir,tname)
            self.backupTable(tname, jsonPath)

    def loadTable(self, tname, jsonPath):
        print "Loading %s from %s" % (tname, jsonPath)
        col = self.db[tname]
        f = open(jsonPath)
        obj = json.loads(f.read())
        recs = obj['records']
        for rec in recs:
            if 'id' in rec and '_id' not in rec:
                rec['_id'] = rec['id']
                del rec['id']
            col.insert_one(rec)
        return obj

    def restore(self, dir, tables=TABLES):
        for tname in tables:
            jsonPath = "%s/%s_dump.json" % (dir,tname)
            self.loadTable(tname, jsonPath)

    def get(self, tname, id):
        conn = rdb.connect(db=DB_NAME)
        recs = rdb.table(tname).filter({"id": id}).run(conn)
        return recs.next()


def optList(x):
    print "optList x:", x
    if x:
        return x
    return []

def testInsertComment():
    r = RethinkDB_Admin()
    id = "note_1463090610967_499"
    comment = {'name': 'Don', 'text': 'I agree'}
    print "id:", id
    note = r.get('notes', id)
    comments = note.get("comments", [])
    comments.append(comment)
    print "note:", note
    print
    conn = rdb.connect(db=DB_NAME)
    q = rdb.table("notes").filter({"id":id})
    q = q.update({"comments": comments})
    print "q:", q
    recs = q.run(conn)
    print recs
    note = r.get('notes', id)
    print "note:", note


if __name__ == '__main__':
    mdb = MongoDB_Admin("wv_data")
    mdb.dumpInfo()
    mdb.restore("backup")
    mdb.backup("backup/x2")
    #mdb.create()





