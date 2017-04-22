

import csv, json

MIN_DELTA_T = 0.5

class FlightLog:
    def __init__(self, path):
        self.path = path

    def dump(self):
        #reader = csv.reader(file(self.path))
        reader = csv.DictReader(file(self.path))
        for row in reader:
            lat = row['Latitude']
            lng = row['Longitude']
            alt0 = row['absoluteHeight']
            alt = row['relativeHeight']
            t = row['flightTime(msec)']
            ot = row['offsetTime']
            print t, ot, lat, lng, alt

    def saveTrack(self, jsonPath=None):
        #reader = csv.reader(file(self.path))
        if jsonPath == None:
            jsonPath = self.path.replace(".csv", ".json")
        print "Saving to "+jsonPath
        recs = []
        reader = csv.DictReader(file(self.path))
        startTime = 0
        prevT = 0
        for row in reader:
            lat = row['Latitude']
            lng = row['Longitude']
            alt0 = row['absoluteHeight']
            alt = row['relativeHeight']
            t = row['flightTime(msec)']
            rt = row['offsetTime']
            if not rt:
                continue
            try:
                rt = float(rt)
            except:
                print "rt: "+rt
                continue
            ot = row['offsetTime']
            if not lat:
                continue
            if rt - prevT < MIN_DELTA_T:
                continue
            prevT = rt
            pos = [lat, lng, alt]
            rec = {'pos': pos, 'rt': rt, 'time': rt}
            recs.append(rec)
        endTime = startTime + rt
        dur = endTime - startTime
        obj = {'duration': dur,
               'recs': recs,
               'startTime': startTime,
               'endTime': endTime,
               'coordinateSystem': 'geo',
               }
        file(jsonPath, "w").write(json.dumps(obj, indent=3));

        
def test():
    #path = "c:/GitHub/WorldViews/wvs/play/DJI_ASSISTANT_EXPORT_FILE_2017-04-20_15-05-56.FLY092.csv"
    paths = [
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY091.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY092.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY094.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY098.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY100.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY101.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY102.csv",
        "c:/GitHub/WorldViews/wvs/play/flightLogs/FLY103.csv",
        ]
    for path in paths:
        log = FlightLog(path)
        log.saveTrack()
    
if __name__ == '__main__':
    test()
    
