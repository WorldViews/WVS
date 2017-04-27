"""
This is a package for a flask worldviews server application.
It has a module called Accounts that can be included for user
accounts, authenticaion, social auth, and and admin interface.
authentication, and also it is registerable or trackable.

Here is sample use of flask_social with mongoengine
https://github.com/mattupstate/flask-social/blob/develop/tests/test_app/mongoengine.py

"""
import sys
import os
path = os.path.dirname(__file__)
sys.path.insert(0, path + '/../../config')

# Load the config file
try:
    from ADMIN_CONFIG import MAIL_USERNAME, MAIL_PASSWORD, MAIL_SERVER, MAIL_PORT, MAIL_USE_SSL, MAIL_USE_TLS, \
        twitter_ckey, twitter_csecret, fb_app_id, fb_app_secret, g_client_id, g_client_secret
except ImportError:
    print "Can't find ADMIN_CONFIG"
# print "MAIL_USERNAME:", MAIL_USERNAME

import json, time, traceback, socket
from datetime import datetime
import flask

#from wtforms import Form, BooleanField, StringField, PasswordField, validators

from flask_mongoengine import MongoEngine

from flask import Flask, render_template, send_file, redirect, \
                  send_from_directory, request, url_for

from flask_socketio import SocketIO, emit
from flask_mail import Mail, Message
from flask_cors import CORS

from jsonHack import jsonify, jsondumps

import WVNotification
from werkzeug.contrib.fixers import ProxyFix
import json


#execfile("../config/ADMIN_CONFIG.py")

DB_REQUEST_TIMES = {}
USER_TIMES = {}
SERVER_START_TIME = time.time()

PREV_YOUTUBE_ID = None

DBA = None

try:
    #import RDBA
    #DBA = RDBA.RDBAdapter()
    import MDBA
    DBA = MDBA.MDBAdapter()
except:
    traceback.print_exc()
    print "No RDBA adapter"

def get_webpack_manifest():
    try:
        manifest_path = os.path.join(path, '../../static/react/manifest.json')
        with open(manifest_path) as f:
            webpack_manifest = json.load(f)
    except:
        webpack_manifest = {}
    return webpack_manifest


#app = Flask(__name__, static_url_path='')
app = Flask(__name__, static_url_path='/static',
            static_folder="../../static")

# setup cors to open up socket.io
cors = CORS(app, resources={r"/socket.io/*": {"origins": "*"}})


app.wsgi_app = ProxyFix(app.wsgi_app)
app.debug = True
#app.debug = False
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wv.db'
#app.config['MONGODB_SETTINGS'] = {'DB': 'test0'}
app.config['MONGODB_SETTINGS'] = {'DB': 'wv_data'}

app.config['SECURITY_TRACKABLE'] = True
app.config['SECURITY_REGISTERABLE'] = True
app.config['SECURITY_CONFIRMABLE'] = True
app.config['SECURITY_RECOVERABLE'] = True
app.config['SECURITY_CHANGEABLE'] = True
#app.config['SECURITY_EMAIL_SENDER'] = 'no-reply@pollywss.paldeploy.com'
app.config['SECURITY_EMAIL_SENDER'] = 'no-reply@paldeploy.com'
app.config['SECURITY_PASSWORD_SALT'] = '8xGnklqeavTIL+KqzAp0J3vgx1+4vDaCBdfrVZSNFyIAFLdnW6vhlxaPsYObJSI+F5X0pHI4J0qH\n8t6fq257Kw=='
app.config['SECURITY_PASSWORD_HASH'] = 'pbkdf2_sha512'
app.config['SECURITY_RESET_PASSWORD_WITHIN'] = '5 minutes'

app.config['MAIL_SERVER'] = MAIL_SERVER
app.config['MAIL_PORT'] = MAIL_PORT
app.config['MAIL_USE_SSL'] = MAIL_USE_SSL
app.config['MAIL_USE_TLS'] = MAIL_USE_TLS
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD

upload_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
app.config['UPLOAD_PATH'] = upload_path
if not os.path.exists(upload_path):
    os.makedirs(upload_path)

app.config['SOCIAL_TWITTER'] = {
    'consumer_key': twitter_ckey,
    'consumer_secret': twitter_csecret
}

app.config['SOCIAL_FACEBOOK'] = {
    'consumer_key': fb_app_id,
    'consumer_secret': fb_app_secret
}

app.config['SOCIAL_GOOGLE'] = {
    'consumer_key': g_client_id,
    'consumer_secret': g_client_secret
}

mail = Mail(app)

"""
The NOTIFIER is used to check for various events that may
trigger notifications to be produced for users who have
registered interest in those events.  For example, this
may cause e-mail when new questions are posted.
"""
NOTIFIER = WVNotification.Notifier(DBA, Message, mail)

socketio = SocketIO(app, async_mode='eventlet')

# Create database connection object
#db = SQLAlchemy(app)
db = MongoEngine(app)

import flask_worldviews.Accounts
import flask_worldviews.Projects
import flask_worldviews.Posts
import flask_worldviews.Streams
import flask_worldviews.Polly
import flask_worldviews.models.tracks
import flask_worldviews.views.tracks

@app.route('/')
def index():
    """
    print "index ****"
    #page = "index.html"
    page = "worldviews.html"
    if socket.gethostname() == "tours.xcloud.fxpal.net":
        page = "landing.html"
    return send_file(page)
    """
    # if request.url == "http://worldviews.org/":
    #     return redirect("http://worldviews.paldeploy.com")
    #print "request.full_url", request.url
    return render_template("worldviews.html")

@app.route('/TeleViewer')
@app.route('/televiewer')
def televiewer():
    return render_template("TV.html")

@app.route('/memorialpark')
def lefletjs_viewer():
    return render_template("leafletjs_viewer.html")

@app.route('/xmemorialpark')
def xlefletjs_viewer():
    return render_template("xleafletjs_viewer.html")

@app.route('/xtour')
def xlefletjs_tour():
    return render_template("xtour.html")

@app.route('/react')
@app.route('/cherryblossom')
def react_view():
    webpack_manifest = get_webpack_manifest()
    return render_template('react.html',
        bundle=webpack_manifest.get('app.js', 'app.bundle.js'),
        vendor=webpack_manifest.get('vendor.js', 'vendor.bundle.js'),
        manifest=webpack_manifest.get('manifest.js', 'manifest.bundle.js')
        )

@app.route('/chat')
@app.route('/toyokawa')
def videochat_view():
    webpack_manifest = get_webpack_manifest()
    return render_template('react.html',
        bundle=webpack_manifest.get('videochat.js', 'videochat.bundle.js'),
        vendor=webpack_manifest.get('vendor.js', 'vendor.bundle.js'),
        manifest=webpack_manifest.get('manifest.js', 'manifest.bundle.js')
        )

"""
This is used by SharedCam to register itself with us.
"""
@app.route('/regp/', methods=['POST', 'GET'])
def reg():
    print "reg path:", request.path
    print "reg args", request.args
    t = time.time()
    name = request.args.get('name')
    tagStr = request.args.get('tagStr')
    clientType = request.args.get('clientType')
    lon = float(request.args.get('longitude'))
    lat = float(request.args.get('latitude'))
    room = request.args.get('room')
    numUsers = int(request.args.get('numUsers'))
    sessionId = request.args.get('sessionId')
    sessionId = sessionId.replace(':', '_')
    sessionId = sessionId.replace('-', '_')
    obj = {'t': t, 'name': name, 'tagStr': tagStr,
           'lon': lon, 'lat': lat, 'room': room,
           'sessionId': sessionId,
           'numUsers': numUsers, 'clientType': clientType}
    print obj
    #jstr = json.dumps(obj)
    jstr = jsondumps(obj)
    print "jstr:", jstr
    if socketio:
        print "send to socketio"
        emit('sharecam', jstr, broadcast=True, namespace='/')
    return "Ok"
#    return flask.jsonify({'val': 'ok'})

"""
@app.route("/WV/<path:path>")
def getPage(path):
    return render_template(path+".html")
"""

@app.route('/Viewer/TV')
def viewerTV():
    print "viewerTV"
#    return send_from_directory('Viewer', "TV.html")
    return render_template("TV.html")


@app.route('/static/<path:path>')
def send_static(path):
    print "send_static", path
    return send_from_directory('static', path)

@app.route('/comment/<path:etype>', methods=['POST','GET'])
def addCommentToNote(etype):
    print "addCommentToNote", etype
    req = {}
    args = request.args
    print "args:", args
    if request.data:
        req = json.loads(request.data)
    for key in args:
        #req[key] = args[key][0]
        req[key] = args[key]
    print "req:", req
    parentId = req['parent']
    comment = req['comment']
    print "parentId:", parentId
    print "comment:", comment
    if type(comment) in [type("str"), type(u"str")]:
        cObj = {'text': comment,
                'type': 'comment',
                't': time.time()}
        if 'userId' in req:
            cObj['userId'] = req['userId']
        if 'name' in req:
            cObj['name'] = req['name']
        comment = cObj
    note = DBA.getNote(parentId)
    print "note:", note
    comments = note.get("comments", [])
    comments.append(comment)
    print "comments:", comments
    note['comments'] = comments
    #jObj = json.dumps(note)
    jObj = jsondumps(note)
    print "etype:", etype
    print "jObj:", jObj
    if socketio:
        print "send to socketio"
        emit(etype, jObj, broadcast=True, namespace='/')
    print "**** addToDB"
    DBA.replaceObjToDB(note, etype)
    if NOTIFIER:
        NOTIFIER.noticeNewComment(note, comment)
    print
    #return flask.jsonify({'status': 'OK'})
    return jsonify({'status': 'OK'})

@app.route('/db/<path:etype>')
def query(etype):
    global DB_REQUEST_TIMES
    print "query", etype
    t = time.time()
    DB_REQUEST_TIMES[etype] = t
    if DBA == None:
        return jsonify({'error': 'No DB', 't': t, 'records': []})
    obj = DBA.query(etype, request.args, t)
    return jsonify(obj)

"""
This returns an object that gives the most recent request
for a table by type of table.   It is intended as a mechanism
for event Watcher streams to know when their kinds of events
are requested.
"""
@app.route('/dbstats/')
def dbstats():
    return jsonify(DB_REQUEST_TIMES)

@app.route('/userstats/')
def userstats():
    return jsonify(USER_TIMES)

"""
--------------------------------------------------------------------
Support for slave viewers:

These functions are so that a slave viewer can show videos that were
selected in the main TeleViewer, say running on a large display.  If
someone clicks on a billboard or causes a video to play in the main
viewer, the server is notified by /notify/ with a message including
the youtubeId of the video.   A call to /wvCurrentUrl always returns
the most recent youtube URL.

This mechanism can be used so that if someone has an HMD and is using
a display to run TeleViewer, they can then see the selected view in
the HMD running Samsung internet viewer.

Currently this is done in a global namespace but should be moved to
a scheme where the master has a name.
"""
@app.route('/wvCurrentUrl')
def wvCurrentUrl():
    url = "https://youtube.com"
    if PREV_YOUTUBE_ID:
        url = "https://www.youtube.com/watch?v=%s" % PREV_YOUTUBE_ID
    return redirect(url)

@app.route('/notify/', methods=['GET', 'POST'])
def notifyServer():
    dict = {}
    if request.method == 'POST':
        print "request.data:", request.data
    else:
        for key in request.args:
            dict[key] = request.args[key]
    print "dict:", dict
    if 'youtubeId' in dict:
        global PREV_YOUTUBE_ID
        PREV_YOUTUBE_ID = dict['youtubeId']
    return jsonify({})

def run(port=80, host="0.0.0.0"):
    print "Running flask server", port, host
    socketio.run(app, host=host, port=port)
    #socketio.run(app, port=80)

if __name__ == '__main__':
    run()
