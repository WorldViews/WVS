#!/usr/bin/python
# -*- coding: utf-8 -*-

import codecs
import sys, time, json, traceback

from apiclient.discovery import build
from apiclient.errors import HttpError
#from oauth2client.tools import argparser


# Set DEVELOPER_KEY to the API key value from the APIs & auth > Registered apps
# tab of
#   https://cloud.google.com/console
# Please ensure that you have enabled the YouTube Data API for your project.
#DEVELOPER_KEY = "REPLACE_ME"
exec file("YOUTUBE_DEV_KEY.txt").read()

YOUTUBE_API_SERVICE_NAME = "youtube"
#YOUTUBE_API_SERVICE_NAME = "WVVidWatch"
YOUTUBE_API_VERSION = "v3"


class YouTubeScraper:
   def __init__(self, useUTF8=True):
      if useUTF8:
         UTF8Writer = codecs.getwriter('utf8')
         sys.stdout = UTF8Writer(sys.stdout)
      self.query = ""
      self.recs = {}
      self.VIDNUM = 0
      self.youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION,
                           developerKey=DEVELOPER_KEY)

   def getChannelId(self, username):
      # Retrieve the contentDetails part of the channel resource for the
      # authenticated user's channel.
      channels_response = self.youtube.channels().list(
         forUsername="enockglidden",
         part="contentDetails"
         ).execute()
      #print json.dumps(channels_response, indent=True)
      try:
         return channels_response["items"][0]["id"]
      except:
         return None

   def getChannelVideosForUser(self, username="enockglidden", fname=None):
      """
      Find videos for all channels of a given user
      that have location information available.
      """
      self.query = "channelSearch: username=%s" % username
      if fname == None:
         fname = "%s_data.json" % username
      videoIds = []
      channels_response = self.youtube.channels().list(
         forUsername=username,
         part="contentDetails"
         ).execute()

      print json.dumps(channels_response, indent=True)

      for channel in channels_response["items"]:
         # From the API response, extract the playlist ID that identifies the list
         # of videos uploaded to the authenticated user's channel.
         uploads_list_id = channel["contentDetails"]["relatedPlaylists"]["uploads"]

         print "Videos in list %s" % uploads_list_id

         # Retrieve the list of videos uploaded to the authenticated user's channel.
         playlistitems_list_request = self.youtube.playlistItems().list(
            playlistId=uploads_list_id,
            #part="snippet,recordingDetails",
            part="snippet",
            maxResults=50
            )

         while playlistitems_list_request:
            playlistitems_list_response = playlistitems_list_request.execute()

            # Print information about each video.
            for playlist_item in playlistitems_list_response["items"]:
               title = playlist_item["snippet"]["title"]
               video_id = playlist_item["snippet"]["resourceId"]["videoId"]
               print "%s (%s)" % (title, video_id)
               if 0:
                  print json.dumps(playlist_item, indent=4, sort_keys=True)
                  print
               videoIds.append(video_id)
               playlistitems_list_request = self.youtube.playlistItems().list_next(
                  playlistitems_list_request, playlistitems_list_response)
      video_ids = ",".join(videoIds)
      print "video_ids:", video_ids
      self.processIds(video_ids)
      self.saveRecs(fname)

   def getLocs(self, latMin, lonMin, latMax, lonMax, dlat, dlon):
      print "getting locs from %s to %s lat in steps of %s and %s to %s lon in steps of %s" % \
                   (latMin, latMax, dlat, lonMin, lonMax, dlon)
      locs = []
      for lat in range(latMin,latMax+dlat,dlat):
         for lon in range(lonMin,lonMax+dlon,dlon):
            if lat==0 and lon==0:
               continue
            if (lat==-90 or lat==90) and lon != 0:
               continue
            locs.append("%.1f,%.1f" % (lat,lon))
      print "Got %d specific points" % len(locs)
      return locs

   def fetch(self, name, query=None, locs=None, dimension="any", username=None, channelId=None):
      if query == None:
         query = name
      if username != None:
         channelId = self.getChannelId(username)
      fname = "%s_data.json" % name
      if locs == None:
         locs = ["37.42307,-122.08427",
                 "15.0465951,-166.3735415"]
      """
      These choices are experimental and not very well worked
      out yet.
      """
      if type(locs) in [type("str"), type(u"str")]:
         if locs.lower() == "global":
            locs = self.getLocs(-90, -180, 90, 180, 4, 4)
         if locs.lower() == "us":
            locs = self.getLocs(36, -123, 44, -66, 1, 1)
      for loc in locs:
         try:
            self.search(query=query, location=loc, dimension=dimension, channelId=channelId)
         except HttpError, e:
            print "An HTTP error %d occurred:\n%s" % (e.resp.status, e.content)
         except:
            traceback.print_exc()
         self.saveRecs(fname)

   def search(self, query, location, max_results=50, location_radius="1000km", dimension="any", channelId=None):
      print "query:", query
      print "location:", location
      print "location_radius:", location_radius
      self.query = query
      """
      youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION,
                      developerKey=DEVELOPER_KEY)
      """

      # Call the search.list method to retrieve results matching the specified
      # query term.
      search_response = self.youtube.search().list(
          q=query,
          type="video",
          location=location,
          videoDimension=dimension,
          locationRadius=location_radius,
          channelId=channelId,
          part="id,snippet",
          maxResults=max_results
      ).execute()

      search_videos = []

      # Merge video ids
      for search_result in search_response.get("items", []):
         search_videos.append(search_result["id"]["videoId"])
      video_ids = ",".join(search_videos)
      self.processIds(video_ids)

   def processIds(self, video_ids):
      print "processIds video_ids:", video_ids
      # Call the videos.list method to retrieve location details for each video.
      video_response = self.youtube.videos().list(
         id=video_ids,
         part='snippet, recordingDetails'
      ).execute()

      # Add each result to the list, and then display the list of matching videos.
      items = video_response.get("items", [])
      print "Got %d items" % len(items)
      for video_result in items:
         """
         if "recordingDetails" not in video_result:
            print "video_result missing recordingDetails for id", video_result["id"]
            continue
         if "location" not in video_result['recordingDetails']:
            print "no location in recording details for id", video_result["id"]
            continue
         if 0:
            print json.dumps(video_result, indent=4)
            print
         """
         #print video_result
         try:
            lat = video_result["recordingDetails"]["location"]["latitude"]
            lon = video_result["recordingDetails"]["location"]["longitude"]
            title = video_result["snippet"]["title"]
         except:
            print "Cannot get location data from record for", video_result["id"]
            continue
         self.VIDNUM += 1
         id = video_result["id"]
         rec = {'youtubeId': id,
                'id': "%d" % self.VIDNUM,
                'lat': lat,
                'lon': lon,
                'title': title}
         rec['publishedAt'] = video_result["snippet"]["publishedAt"]
         rec['thumbnails'] = video_result["snippet"]["thumbnails"]
         self.recs[id] = rec
         #print rec

   def saveRecs(self, jsonPath):
      t0 = time.time()
      recs = []
      for id in self.recs.keys():
         recs.append(self.recs[id])
      f = UTF8Writer(file(jsonPath, "w"))
      obj = {'query': self.query,
             'time': time.time(),
             'records': recs}
      f.write(json.dumps(obj, indent=4, sort_keys=True))
      t1 = time.time()
      print "Wrote %d recs to %s in %.3fs" % (len(recs), jsonPath, t1-t0)


#argparser.add_argument("--location-radius", help="Location radius", default="1000km")
#argparser.add_argument("--max-results", help="Max results", default=50)

def fetch(name, query=None, loc="global", dimension="any", username=None):
   ys = YouTubeScraper()
   ys.fetch(name, query, loc, dimension, username)
#   ys.fetch(name, query, loc, dimension)

def getMetaData(id=None, opath=None):
    ys = YouTubeScraper()
    ys.processIds(id)
    print ys.recs
    if opath:
       ys.saveRecs(opath)

def testGetMetaData():
   print "-----------------------------------"
   getMetaData("JYk0qa8D4JY")
   print "-----------------------------------"
   getMetaData("cFtySuUNCcQ")
   print "-----------------------------------"
   ids = "JYk0qa8D4JY,cFtySuUNCcQ"
   getMetaData(ids, "testMetaData.json")
   
def saveEnocksVideoLayer():
   ys = YouTubeScraper()
   ys.getChannelVideosForUser("enockglidden")

def testChannels():
   ys = YouTubeScraper()
   usernames = ["enockglidden"]
   for username in usernames:
      print "username:", username
      id = ys.getChannelId(username)
      print "id:", id
      ys.getChannelVideosForUser(username)
      print
   print

if __name__ == "__main__":
#   fetch("hiking")
#   fetch("surfing")
#   fetch("boating", query="boating|sailing|surfing|waterski -fishing", loc=None)
#   fetch("waterSports3D", query="360 video", loc=None)
#    fetch("test", username="enockglidden", loc="us")
#    fetch("test", username="enockglidden", loc=["36.98,-122.00"])
#    fetch("test", query="Wilder Ranch State Park", loc=["36.98418,-122.09912"])
#   testChannels()
#   saveEnocksVideoLayer()
   testGetMetaData()





