
import requests
import json

API_KEY="AIzaSyAgNC5GSbLOBPW29sIQA9rzawv44N5r21s"
"""
First got it using

https://www.googleapis.com/blogger/v3/blogs/byurl?url=https://irishsea-mark-videos.blogspot.com/&key=AIzaSyAgNC5GSbLOBPW29sIQA9rzawv44N5r21s

https://www.googleapis.com/blogger/v3/blogs/4967929378133675647/pages/273541696466681878?key=AIzaSyAgNC5GSbLOBPW29sIQA9rzawv44N5r21s

"""

# Mark's blog id
BLOG_ID = 6399929398021759307

def getPosts(blogId):
    url = "https://www.googleapis.com/blogger/v3/blogs/%s/posts" % blogId
    params = {'key': API_KEY, 'max-results': 200}
    i = 0
    while True:
        i += 1
        if i > 1:
            break
        print "url:", url
        print "params:", params
        rep = requests.get(url, params=params)
        obj = rep.json()
        items = obj["items"]
        del obj["items"]
        print json.dumps(obj, indent=3)
        print
        for item in items:
            print item["title"]
        if 'nextPageToken' not in obj:
            break
        params['nextPageToken'] = obj['nextPageToken']
    print "Done"

    
getPosts(BLOG_ID)

