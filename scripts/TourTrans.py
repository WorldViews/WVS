
import math
import json


def tourTrans(inPath, outPath):
    print "tourTrans %s => %s" % (inPath, outPath)
    tour = json.load(file(inPath))
    for rec in tour['recs']:
        x,y,z = rec['pos']
        x = 1.6*x - 1
        y = 1.8*y - 4
        rec['pos'] = [x,y,z]
    json.dump(tour, file(outPath, "w"), indent=4)


def run():
    inPath = "C:/GitHub/PanoJS/tours/data/quinlan_path_1.json"
    outPath = "C:/GitHub/PanoJS/tours/data/quinlan_path_2.json"
    outPath = "C:/GitHub/WorldViews/WVS/static/data/paths/MemorialPark/quinlan_path_1tweak.json"
    tourTrans(inPath, outPath)
    
if __name__ == '__main__':
    run()



