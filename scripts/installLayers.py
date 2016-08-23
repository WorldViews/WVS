"""
This script reads from scraped_data files and merges with files
in static/data (the files actually seen by TeleViewer.)
"""
import traceback, shutil, os

SCRAPED_DIR = "../scraped_data"
TARGET_DIR = "../TeleViewer/static/data"

def installLayer(fileName):
    srcPath = "%s/%s.json" % (SCRAPED_DIR, fileName)
    dstPath = "%s/%s.json" % (TARGET_DIR, fileName)
    bakPath = dstPath+".bak"
    if os.path.exists(dstPath):
        print "Backing up %s to %s" % (dstPath, bakPath)
        shutil.copyfile(dstPath, bakPath)
    print "Copying %s to %s" % (srcPath, dstPath)
    shutil.copyfile(srcPath, dstPath)

def installAllLayers():
    installLayer("Enocks_Blog_data")
    installLayer("Marks_Blog_data")


if __name__ == '__main__':
    installAllLayers()



