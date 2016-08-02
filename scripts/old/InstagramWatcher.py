
import sys
import urllib2
import exifread
from StringIO import StringIO
from instagram import client, subscriptions

HTML_HEAD = """<html>
<head>
</head>
<body>
"""

HTML_FOOT = """</body>
</html>
"""

ENTRY_TEMPLATE = """
%(n)s %(type)s <a href="%(url)s">%(caption)s</a><br>\n
"""

session_opts = {
    'session.type': 'file',
    'session.data_dir': './session/',
    'session.auto': True,
}


CONFIG = {
    'client_id': '1884876d6279401099d35b412f4f4497',
    'client_secret': '5f5441f0eba048cc82da484d46c332c1',
    'redirect_uri': 'http://localhost:8515/oauth_callback'
}


class InstagramWatcher:
    def __init__(self):
        self.api = client.InstagramAPI(client_id='1884876d6279401099d35b412f4f4497',
                                  client_secret='5f5441f0eba048cc82da484d46c332c1')

    def getPics(self, tag, out=sys.stdout):
        if type(out) in [type("str"), type(u"str")]:
            print "Opening file:", out
            out = open(out, "w")
        context, next_url = self.api.tag_recent_media(100, tag_name=tag)
        for media in context:
            out.write("%s\n" % media.caption)
            if(media.type == 'video'):
                out.write("video\n")
                url = media.get_standard_resolution_url()
            else:
                out.write("image\n")
                url = media.get_low_resolution_url()
            out.write("%s\n" % url)

    def getMedia(self, tag, num=300):
        items = []
        context, next_url = self.api.tag_recent_media(num, tag_name=tag)
        n = 0
        for media in context:
            #print dir(media)
            n += 1
            if(media.type == 'video'):
                url = media.get_standard_resolution_url()
            else:
                url = media.get_standard_resolution_url()
                #url = media.get_low_resolution_url()
            item = {'n': n,
                    'type': media.type,
                    'caption': media.caption,
                    'url': url}
            items.append(item)
        obj = {'items': items}
        return obj

    def saveImage(self, item):
        if item['type'] != 'image':
            return None
        name = "images/%s.jpg" % item['n']
        uos = urllib2.urlopen(item['url'])
        file(name, "wb").write(uos.read())
        return name

    def saveImages(self, obj):
        for item in obj['items']:
            self.saveImage(item)

    def getExifTags(self, jpgPath):
        tags = exifread.process_file(file(jpgPath, "rb"))
        return tags

    def checkForGPS(self, obj):
        for item in obj['items']:
            try:
                path = self.saveImage(item)
                if path:
                    tags = self.getExifTags(path)
                    print tags
            except:
                print "Cannot get image for", item['url']

    def genHTML(self, obj, out):
        if type(out) in [type("str"), type(u"str")]:
            print "Saving to file:", out
            out = open(out, "w")
        out.write(HTML_HEAD)
        for item in obj['items']:
            out.write(ENTRY_TEMPLATE % item)
        out.write(HTML_FOOT)

def test():
    iw = InstagramWatcher()
    #iw.getPics("bebop", "recent.txt")
    obj = iw.getMedia("bebop")
    iw.checkForGPS(obj)
#    iw.genHTML(obj, "recent.html")

if __name__ == '__main__':
    test()


