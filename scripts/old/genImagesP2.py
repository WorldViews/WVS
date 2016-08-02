
from math import log, pow
import os, traceback
import Image, ImageDraw

def lg(x):
    return log(x)/log(2.0)

def truncDown(n):
    return int(pow(2,int(lg(n))))

def verifyDir(path):
   if not os.path.exists(path):
       print "Creating", path
       os.mkdir(path)

def add_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2, rad * 2), fill=255)
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    alpha.paste(circle.crop((0, rad, rad, rad * 2)), (0, h - rad))
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    alpha.paste(circle.crop((rad, rad, rad * 2, rad * 2)), (w - rad, h - rad))
    im.putalpha(alpha)
    return im

def genImagePow2(path, opath, ow=None, oh=None, cornerRad=200):
    path = path.replace("\\", "/")
    if not (path.endswith(".jpg") or path.endswith(".png")):
        return
    print "Opening", path, os.path.exists(path)
    im = Image.open(path)
    w,h = im.size
    if not ow:
        ow = truncDown(w)
    if not oh:
        oh = truncDown(h)
    size = im.size
    im = im.resize((ow,oh), Image.ANTIALIAS)
    if cornerRad:
        im = add_corners(im, cornerRad)
    print "Saving", opath, w, h, ow, oh
    im.save(opath)

def genImagesPow2(inputDir, outputDir):
    verifyDir(outputDir)
    names = os.listdir(inputDir)
    for name in names:
        path = os.path.join(inputDir, name)
        opath = os.path.join(outputDir, name)
        try:
            genImagePow2(path, opath)
        except:
            traceback.print_exc()


def genImagesPow2Rename(inputDir, outputDir, cornerRad=None):
    verifyDir(outputDir)
    names = os.listdir(inputDir)
    i = 0
    for name in names:
        if not (name.lower().endswith(".jpg") or name.lower().endswith(".png")):
            continue
        i += 1
        #oname = "image%03d.png"
        oname = "image%d.png" % i
        path = os.path.join(inputDir, name)
        opath = os.path.join(outputDir, oname)
        try:
            genImagePow2(path, opath, cornerRad=cornerRad)
        except:
            traceback.print_exc()



if __name__ == '__main__':
    """
    genImagesPow2Rename("../images", "../imagesPow2")
    genImagesPow2Rename("../images", "../imagesRoundedPow2", cornerRad=200)

    genImagesPow2Rename("../images/FXPAL/src", "../images/FXPAL/imagesPow2")
    genImagesPow2Rename("../images/FXPAL/src", "../images/FXPAL/imagesRoundedPow2",
                                                                cornerRad=200)
    """
    genImagesPow2Rename("../images/Spirals/src", "../images/Spirals/imagesPow2")
    genImagesPow2Rename("../images/Spirals/src", "../images/Spirals/imagesRoundedPow2",
                                                                cornerRad=200)


