

import csv

class FlightLog:
    def __init__(self, path):
        self.path = path

    def dump(self):
        #reader = csv.reader(file(self.path))
        reader = csv.DictReader(file(self.path))
        for row in reader:
            lat = row['Latitude']
            lng = row['Longitude']
            t = row['flightTime(msec)']
            ot = row['offsetTime']
            print t, ot, lat, lng

def test():
    path = "c:/GitHub/WorldViews/wvs/play/DJI_ASSISTANT_EXPORT_FILE_2017-04-20_15-05-56.FLY092.csv"
    log = FlightLog(path)
    log.dump()
    
if __name__ == '__main__':
    test()
    
