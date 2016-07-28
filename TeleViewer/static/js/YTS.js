
var YTS = {};

function report(str) { console.log(str); }

YTS.YOUTUBE_V3_CLIENT_LOADED = false;
YTS.MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
YTS.API_ACCESS_KEY = 'AIzaSyBuQiHS4B-axfTUpBGNeJlF2J78k962zkc';
 
/** Initialize portions of page on page load and create object with all News channels in it
 */
$(document).ready(function() {
    var url = 'https://apis.google.com/js/client.js?onload=YTS_handleClientLoad';
    report("getScript: "+url);
    $.getScript(url);
});

YTS_handleClientLoad = function() {
    report("YTS_handleClientLoad");
    gapi.client.load('youtube', 'v3', function() {
	    YTS.YOUTUBE_V3_CLIENT_LOADED = true;
	    report("youtube_v3 loaded");
	});
}

/** This method handle search button clicks.   It pulls data from the web
 * form into the inputObject and then calls the search function.
 */
function clickedSearchButton() {
    var query = $("#topic").val()
    YTS.youtubeSearch(query, YTS.resultsHandler, YTS.errorHandler);
}

YTS.errorHandler = function(err)
{
    console.log("err: "+err);
}

YTS.resultsHandler = function(results)
{
    console.log("results:\n"+JSON.stringify(results, null, 4));
}


YTS.youtubeSearch = function(query, lat, lon, range, resultsHandler, errorHandler) {
    inputLat = lat;
    inputLong = lon;
    inputQuery = query;
    inputRadius = range;
    try {
	var request = gapi.client.youtube.search.list({
		q: inputQuery,
		order: "date",
		type: "video",
		part: "id,snippet",
		location: inputLat + "," + inputLong,
		locationRadius: inputRadius,
		maxResults: "50",
		key: YTS.API_ACCESS_KEY
            });
    } catch (err) {
	//cannot search via the YouTube API
	console.log("**** Error connecting to Google APIs");
	errorHandler(err);
	return;
    }
    YTS.processYouTubeRequest(request, resultsHandler, errorHandler);
}


YTS.processYouTubeRequest = function(request, resultsHandler, errorHandler) {
  request.execute(function(response) {
    var resultsArr = [];
    var videoIDString = '';

    //if the result object from the response is null, show error; if its empty, remove old results and display
    //message on how to broaden search to get more results.
    if (!response) {
	errorHandler("No Response");
	return;
    }
    if ('error' in response) {
	errorHandler(response['error']);
	return;
    }
    if (!response.result || !response.result.items) {
	errorHandler("No Results");
	return;
    } else {
      var entryArr = response.result.items;
      for (var i = 0; i < entryArr.length; i++) {
        var videoResult = new Object();
        videoResult.title = entryArr[i].snippet.title;

        //Pull the lattitude and longitude data per search result
	// if ((inputObject.hasSearchLocation) && entryArr[i].georss$where) {
        if (entryArr[i].georss$where) {
          var latlong = entryArr[i].georss$where.gml$Point.gml$pos.$t;
          var latlongArr = latlong.split(' ');
          videoResult.lat = latlongArr[0].trim();
          videoResult.lon = latlongArr[1].trim();
        }

        videoResult.videoId = entryArr[i].id.videoId;
        videoIDString = videoIDString + videoResult.videoId + ",";

        videoResult.url = "https://www.youtube.com/watch?v=" + videoResult.videoId;
        videoResult.channelID = entryArr[i].snippet.channelId;
        videoResult.channel = entryArr[i].snippet.channelTitle;
        videoResult.liveBroadcastContent = entryArr[i].snippet.liveBroadcastContent;
        videoResult.thumbNailURL = entryArr[i].snippet.thumbnails.default.url;
        videoResult.description = entryArr[i].snippet.description;

        var year = entryArr[i].snippet.publishedAt.substr(0, 4);
        var monthNumeric = entryArr[i].snippet.publishedAt.substr(5, 2);
        var monthInt = 0;

        if (monthNumeric.indexOf("0") === 0) {
          monthInt = monthNumeric.substr(1, 1);
        } else {
          monthInt = monthNumeric;
        }
        var day = entryArr[i].snippet.publishedAt.substr(8, 2);
        var time = entryArr[i].snippet.publishedAt.substr(11, 8);

        var monthString = YTS.MONTH_NAMES[monthInt - 1];

        videoResult.displayTimeStamp = monthString + " " + day + ", " + year + " - " + time + " UTC";
        videoResult.publishTimeStamp = entryArr[i].snippet.publishedAt;

        //add result to results
        resultsArr.push(videoResult);
      }

      //Now we will use the string of video IDs from the search to do another API call to pull latitude
      //and longitude values for each search result

      //remove trailing comma from the string of video ids
      var videoIDStringFinal = videoIDString.substring(0, videoIDString.length - 1);

      //generate request object for video search
      var videoIDRequest = gapi.client.youtube.videos.list({
        id: videoIDStringFinal,
        part: 'id,snippet,recordingDetails',
        key: YTS.API_ACCESS_KEY
      });

      //execute request and process the response object to pull in latitude and longitude
      videoIDRequest.execute(function(response) {
        if ('error' in response || !response) {
          showConnectivityError();
        } else {
          //iterate through the response items and execute a callback function for each
          $.each(response.items, function() {
            var videoRequestVideoId = this.id;

            //ensure recordingDetails and recordingDetails.location are not null or blank
            if (this.recordingDetails && this.recordingDetails.location) {
              //for every search result in resultArr, pull in the latitude and longitude from the response
              for (var i = 0; i < resultsArr.length; i++) {
                if (resultsArr[i].videoId === videoRequestVideoId) {
                  resultsArr[i].lat = this.recordingDetails.location.latitude;
                  resultsArr[i].lon = this.recordingDetails.location.longitude;
                  break;
                }
              }
            }
          });
        }

        //remove duplicates from global results list
	var finalResults = [];
        for (var i = 0; i < resultsArr.length; i++) {
          var addResult = true;
          for (var j = 0; j < finalResults.length; j++) {
            if (resultsArr[i].url === finalResults[j].url) {
              //it is a duplicate, do not add to final results and break inner loop
              addResult = false;
              break;
            }
          }
          if (addResult) {
            finalResults.push(resultsArr[i]);
          }
        }
	resultsHandler(finalResults);
      });
    }
  });
}



