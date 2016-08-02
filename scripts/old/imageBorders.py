
from PIL import Image, ImageFilter

def addBorder(path, opath):
    image = Image.open(path)
    edges = image.filter(ImageFilter.FIND_EDGES)
    image.paste(edges, edges)
    image.save(opath)

if __name__ == '__main__':
    addBorder('../Viewer/images/orangeDrone0.png', '../Viewer/images/orangeDrone.png')






