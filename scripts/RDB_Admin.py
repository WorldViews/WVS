"""
This has a few simple scripts for backing up
or restoring tables to/from JSON files.
"""
import json
import rethinkdb as rdb

DB_NAME = "test"
TABLES = ["periscope", "notes", "chat", "periscope_admin"]

class RethinkDB_Admin:
    def createTable(self, tname):
        conn = rdb.connect(db=DB_NAME)
        res = rdb.table_create(tname).run(conn)
        print res

    def create(self, tables=TABLES):
        for tname in tables:
            self.createTable(tname)

    def deleteTable(self, tname):
        conn = rdb.connect(db=DB_NAME)
        res = rdb.table_drop(tname).run(conn)
        print res

    def delete(self, tables=TABLES):
        for tname in tables:
            self.deleteTable(tname)

    def dumpTable(self, tname, jsonPath=None):
        conn = rdb.connect(db=DB_NAME)
        obj = {'table': tname}
        recs = rdb.table(tname).run(conn)
        recs = [r for r in recs]
        obj['records'] = recs
        if jsonPath:
            print "Saving %s to %s" % (tname, jsonPath)
            f = open(jsonPath, "w")
            f.write(json.dumps(obj, indent=3, sort_keys=True))
        return obj

    def dump(self, dir=None, tables=TABLES):
        for tname in tables:
            jsonPath = None
            if dir:
                jsonPath = "%s/%s_dump.json" % (dir,tname)
            self.dumpTable(tname, jsonPath)

    def loadTable(self, tname, jsonPath):
        print "Loading %s from %s" % (tname, jsonPath)
        f = open(jsonPath)
        obj = json.loads(f.read())
        recs = obj['records']
        conn = rdb.connect(db=DB_NAME)
        recs = rdb.table(tname).insert(recs).run(conn)
        recs = [r for r in recs]
        return obj

    def load(self, dir, tables=TABLES):
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
    r = RethinkDB_Admin()
    #r.dump("backup")
    #r.delete()
    r.create()
    #r.load("backup")
    #r.createTable("periscope_admin")
    #testInsertComment()




