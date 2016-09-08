
import pymongo
from pymongo import MongoClient

def dump():
    client = MongoClient()
    print "client:", client
    dbNames = client.database_names()
    for dbName in dbNames:
        print "--------------------"
        print dbName
        db = client[dbName]
        print "db:", db
        colNames = db.collection_names()
        print colNames
        for colName in colNames:
            print "colName:", colName
            col = db[colName]
            recs = col.find()
            for rec in recs:
                print rec


if __name__ == '__main__':
    dump()

