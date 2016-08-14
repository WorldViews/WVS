
import sqlite3
DB = "wv.db"

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row

def getTables():
    cursor = con.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    return [row['name'] for row in cursor]

def dump():
    tables = getTables()
    for table in tables:
        print "---------------------------------"
        print table
        print
        cursor = con.cursor()
        cursor = cursor.execute("SELECT * FROM %s;" % table)
        for row in cursor:
            print row

dump()



