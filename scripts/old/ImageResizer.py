
from math import log
from math import floor

import PIL
from PIL import Image

def lg(x):
    return log(x)/log(2.0)

def resizePow2(inPath, outPath, cutoff=32):
    img = Image.open(inPath)
    w,h = img.size
    w2 = int(pow(2, floor(lg(w))))
    h2 = int(pow(2, floor(lg(h))))
    if w2 < cutoff:
        w2 *= 2;
    if h2 < cutoff:
        h2 *= 2;
    print "%s,%s -> %s,%s" % (w,h, w2,h2)
    if w2 != w or h2 != h:
        img = img.resize((w2,h2), PIL.Image.ANTIALIAS)
    print "saving to", outPath
    img.save(outPath)

def resize(inPath, outPath, size):
    img = Image.open(inPath)
    img = img.resize(size, PIL.Image.ANTIALIAS)
    img.save(outPath)


if __name__ == '__main__':
    resize('test1.jpg', 'test2.jpg', (200,200))
    resizePow2('test1.jpg', 'test3.jpg')


