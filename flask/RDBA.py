"""
This is an adapter for using Rethinkdb with WorldViews.
"""
import Queue
import rethinkdb as rdb
import json
import traceback

TABLE_NAMES = ["chat", "notes", "periscope"]

NUM_CONNS = 5

class RDBAdapter:
    def __init__(self):
        self.pool = POOL = Queue.Queue(NUM_CONNS)
        #rdb.connect('localhost', 28015).repl()
        for i in range(NUM_CONNS):
            print "Getting connection"
            conn_ = rdb.connect(db='test')
            self.pool.put(conn_)
        print "**** Connection pool has %d connections ****" % self.pool.qsize()

    def getConn(self):
        print "getConn..."
        conn = self.pool.get()
        cnt = self.pool.qsize()
        print "POOL count", cnt, " conn:", conn
        return conn

    def releaseConn(self, conn):
        print "releasing Conn:", conn
        self.pool.put(conn)
        return

    def getObj(self, id, tname):
        print "getObj", id, tname
        obj = None
        try:
            conn = self.getConn()
            recs = rdb.table(tname).filter({'id': id}).run(conn)
            obj = recs.next()
        finally:
            self.releaseConn(conn)
            return obj

    def getNote(self, id):
        return self.getObj(id, 'notes')

    def replaceObjToDB(self, obj, etype):
        print "add Obj to DB:", etype
        print "obj:", obj
        if etype not in TABLE_NAMES:
            print "**** addObjToDB: unknown table:", etype
            return
        try:
            conn = self.getConn()
            rc = rdb.table(etype).replace(obj).run(conn)
        finally:
            self.releaseConn(conn)
            print "Completed insert", rc


    def addMsgStrToDB(self, msgStr, etype):
        print "add Msg to DB:", etype
        if etype not in TABLE_NAMES:
            print "**** addMsgStrToDB unknown table:", etype
            return
        obj = json.loads(msgStr)
        if rdb == None:
            print "*** not connected to DB ***"
        try:
            conn = self.getConn()
            rdb.table(etype).insert(obj).run(conn)
        finally:
            self.releaseConn(conn)

    def addObjToDB(self, obj, etype):
        print "add Obj to DB:", etype
        print "obj:", obj
        if etype not in TABLE_NAMES:
            print "**** addObjToDB: unknown table:", etype
            return
        try:
            conn = self.getConn()
            rc = rdb.table(etype).insert(obj).run(conn)
            print "Completed insert", rc
        finally:
            self.releaseConn(conn)

    def query(self, etype, args, t):
        id = args.get("id", None)
        tMin = args.get("tMin", None)
        limit = args.get("limit", None)
        if limit != None:
            limit = int(limit)
        if tMin != None:
            tMin = float(tMin)
        try:
            q = rdb.table(etype)
            if id != None:
                q = q.filter({'id': id})
            if tMin != None:
                q = q.filter(rdb.row["t"].gt(tMin))
            q = q.order_by(rdb.desc('t'))
            if limit != None:
                q = q.limit(limit)
            print q
            try:
                conn = self.getConn()
                recs = q.run(conn)
                items = list(recs)
            finally:
                self.releaseConn(conn)
        except:
            traceback.print_exc()
            return {}
        items = list(recs)
        obj = {'type': etype,
               't' : t,
               'records': items}
        return obj
