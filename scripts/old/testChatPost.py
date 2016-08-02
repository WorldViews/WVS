
import time
from WVPoster import WVPoster

wv = WVPoster()
wv.postToSIO("chat", {'id': str(time.time()),
                      'name': 'Zeno',
                      't': time.time(),
                      'text': 'Hello.....'})
