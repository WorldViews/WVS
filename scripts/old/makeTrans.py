
from PIL import Image

def makeTrans(inputPath, outputPath, size=None, crop=None, tc=None):
    if tc == None:
        tc = [255,255,255]
    img = Image.open(inputPath)
    img = img.convert("RGBA")
    data = img.getdata()
    newData = []
    nTrans = 0
    #colors = {}
    for item in data:
        #colors[item] = item
        #if item[0] == 255 and item[1] == 255 and item[2] == 255:
        if item[0] == tc[0] and item[1] == tc[1] and item[2] == tc[2]:
            newData.append((255, 255, 255, 0))
            nTrans += 1
        else:
            newData.append(item)
    if nTrans == 0:
        print "No transparent pixels added"
    #print "colors:", colors

    img.putdata(newData)
    if crop:
        print "cropping from", crop
        img = img.crop(crop)
    if size:
        print "resizing to", size
        img = img.resize(size)
    img.save(outputPath, "PNG")


if __name__ == '__main__':
#    makeTrans("../Viewer/temple.png", "../Viewer/temple_trans.png")
#    makeTrans("../Viewer/jumpChat0.png", "../Viewer/jumpChat.png")
#    makeTrans("../Viewer/images/drone0.png",
#              "../Viewer/images/drone.png", (200,200))
#    makeTrans("../Viewer/images/redQmark.png",
#              "../Viewer/images/redQmark.png")
#    makeTrans("../Viewer/images/virtualPhotoWalk0.png",
#              "../Viewer/images/virtualPhotoWalk.png")
#    makeTrans("../Viewer/images/LocalWiki_Banner.svg.png",
#              "../Viewer/images/LocalWiki_Logo.png", crop=[0,0,500,500], size=[250,250])
    makeTrans("../TeleViewer/static/img/twd_logo_big.png",
              "../TeleViewer/static/img/twd_logo.png", size=[250,250])




