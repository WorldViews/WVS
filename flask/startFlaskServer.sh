#!/bin/sh

LOGDIR=/var/log/flycam
WV_HOME=/localhome/flycam/WorldViews/Spirals

echo Stopping Periscope Watcher
pkill -f PeriWatch_xcloud.py

echo Stopping Python TourServer
pkill -f flaskAuthServer9000.py

echo Starting Python TourServer
nohup python flaskAuthServer9000.py > ${LOGDIR}/flaskAuthServer.log 2>&1 &

echo Starting Periscope Watcher
nohup python scripts/PeriWatch_xcloud.py > ${LOGDIR}/PeriscopeWatcher.log 2>&1 &



