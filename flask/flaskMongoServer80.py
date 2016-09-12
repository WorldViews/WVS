"""
This is a version of the flask server with users and
authentication, and also it is registerable or trackable.

Here is sample use of flask_social with mongoengine
https://github.com/mattupstate/flask-social/blob/develop/tests/test_app/mongoengine.py

"""
import sys
#FLASK_SOCIAL_DIR = "C:/GitHub/WorldViews/flask-social"
FLASK_SOCIAL_DIR = "../../flask-social"
sys.path.insert(0, FLASK_SOCIAL_DIR)

import json, time, traceback, socket
from datetime import datetime
import flask

#from wtforms import Form, BooleanField, StringField, PasswordField, validators
from wtforms import Form, BooleanField, StringField, PasswordField, validators

from flask.ext.mongoengine import MongoEngine

from flask_security import Security, MongoEngineUserDatastore, \
    UserMixin, RoleMixin, login_required, current_user, login_user
from flask_security.forms import RegisterForm

from flask import Flask, render_template, send_file, redirect, \
                  send_from_directory, request, url_for
#                  jsonify, send_from_directory, request, url_for
from flask_socketio import SocketIO, emit
from flask_mail import Mail, Message
from flask_admin import Admin
from flask_admin.contrib.mongoengine import ModelView
#from flask_admin.contrib.mongoengine import ModelView

import flask_social
from flask_social import Social, login_failed
from flask_social.utils import get_connection_values_from_oauth_response
from flask_social.datastore import MongoEngineConnectionDatastore

from jsonHack import jsonify, jsondumps

import WVNotification


execfile("../config/ADMIN_CONFIG.py")
print "MAIL_USERNAME:", MAIL_USERNAME

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

#app = Flask(__name__, static_url_path='')
app = Flask(__name__, static_url_path='/static',
            static_folder="../TeleViewer/static")
app.debug = True
#app.debug = False
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wv.db'
app.config['MONGODB_SETTINGS'] = {'DB': 'test0'}

app.config['SECURITY_TRACKABLE'] = True
app.config['SECURITY_REGISTERABLE'] = True
app.config['SECURITY_CONFIRMABLE'] = True
app.config['SECURITY_RECOVERABLE'] = True
app.config['SECURITY_CHANGEABLE'] = True
#app.config['SECURITY_EMAIL_SENDER'] = 'no-reply@pollywss.paldeploy.com'
app.config['SECURITY_EMAIL_SENDER'] = 'no-reply@paldeploy.com'

app.config['MAIL_SERVER'] = MAIL_SERVER
app.config['MAIL_PORT'] = MAIL_PORT
app.config['MAIL_USE_SSL'] = MAIL_USE_SSL
app.config['MAIL_USE_TLS'] = MAIL_USE_TLS
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD

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

NOTIFIER = WVNotification.Notifier(DBA, Message, mail)

socketio = SocketIO(app)

# Create database connection object
#db = SQLAlchemy(app)
db = MongoEngine(app)

# Define models
"""
roles_users = db.Table('roles_users',
        db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
        db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))
"""

class Role(db.Document, RoleMixin):
    name = db.StringField(max_length=80, unique=True)
    description = db.StringField(max_length=255)

class User(db.Document, UserMixin):
    #email = db.StringField(max_length=255, unique=True)
    email = db.StringField(max_length=255)
    name = db.StringField(max_length=255)
    full_name = db.StringField(max_length=255)
    password = db.StringField(max_length=255)
    active = db.BooleanField(default=True)
    confirmed_at = db.DateTimeField()
    last_login_at = db.DateTimeField()
    current_login_at = db.DateTimeField()
    last_login_ip = db.StringField(max_length=45)
    current_login_ip = db.StringField(max_length=45)
    login_count = db.IntField()
    remember_token = db.StringField(max_length=255)
    authentication_token = db.StringField(max_length=255)
    roles = db.ListField(db.ReferenceField(Role), default=[])

    @property
    def connections(self):
        return Connection.objects(user_id=str(self.id))

class Connection(db.Document):
    user_id = db.ObjectIdField()
    provider_id = db.StringField(max_length=255)
    provider_user_id = db.StringField(max_length=255)
    provider_email = db.StringField(max_length=255)
    access_token = db.StringField(max_length=255)
    secret = db.StringField(max_length=255)
    full_name = db.StringField(max_length=255)
    display_name = db.StringField(max_length=255)
    profile_url = db.StringField(max_length=512)
    image_url = db.StringField(max_length=512)
    rank = db.IntField()

    @property
    def user(self):
        return User.objects(id=self.user_id).first()


# Setup Flask-Security
user_datastore = MongoEngineUserDatastore(db, User, Role)
connection_datastore = MongoEngineConnectionDatastore(db, Connection)

class ExtendedRegisterForm(RegisterForm):
    #first_name = StringField('First Name', [validators.Required()])
    #last_name = StringField('Last Name', [validators.Required()])
    name = StringField('Name', [validators.Required()])
    #full_name = StringField('Full Name', [validators.Required()])

class ExtendedConfirmRegisterForm(RegisterForm):
    name = StringField('Name', [validators.Required()])
    #full_name = StringField('Full Name', [validators.Required()])

#security = Security(app, user_datastore)
security = Security(app, user_datastore,
                    register_form=ExtendedRegisterForm,
                    confirm_register_form=ExtendedConfirmRegisterForm)
social = Social(app, connection_datastore)

admin = Admin(app)

class MyModelView(ModelView):
    def is_accessible(self):
        #return login.current_user.is_authenticated()
        #return current_user.is_authenticated()
        return current_user.has_role('admin')

    def inaccessible_callback(self, name, **kwargs):
        # redirect to login page if user doesn't have access
        print "****** redirect for login ******"
        return redirect(url_for('login', next=request.url))

#admin.add_view(MyModelView(User, db.session))
#admin.add_view(MyModelView(Role, db.session))
#admin.add_view(MyModelView(Connection, db.session))
admin.add_view(MyModelView(User))
admin.add_view(MyModelView(Role))
admin.add_view(MyModelView(Connection))

def addUser(email, full_name):
    print "**** addUser", email, full_name
    name = full_name.split()[0]
    user = user_datastore.create_user(email=email,
                               full_name=full_name,
                               name=name,
                               password='xxxxxx',
                               confirmed_at = datetime.utcnow())
    user_datastore.add_role_to_user(email, 'end-user')
    return user

def findOrAddUser(email, full_name):
    print "**** findOrAddUser", email, full_name
    try:
        #user = User.query.filter_by(email=email).first()
        user = User.objects(email=email).first()
        if user:
            print "**** found user"
            return user
    except:
        print traceback.print_exc()
        pass
    return addUser(email, full_name)

def getUserById(id):
    """
    Adding this is a hack to get social auth to work.
    """
    print "=================================="
    return User.query.filter_by(id=id).first()

# Hack to get this visible in flask_social
#flask.ext.social.views.getUserById = getUserById
flask_social.views.getUserById = getUserById



# Create a user to test with
@app.before_first_request
def create_users():
    print "------------------------------------------"
    print "before first request"
    nUsers = User.objects.count()
    if nUsers > 0:
        print "Already have %d users" % nUsers
        return
    print "Creating tables and user entries"
    user_datastore.find_or_create_role(name='admin',
                                       description='Administrator')
    user_datastore.find_or_create_role(name='end-user',
                                       description='End user')
    addUser('donkimber@gmail.com',       'Don Kimber')
    addUser('doczeno@yahoo.com',         'Don')
    addUser('enockglidden@hotmail.com',  'Enock Glidden')
    addUser('sinasareth@yahoo.com',      'Sina')
    addUser('vaughan@fxpal.com',         'Jim Vaughan')
    addUser('indrajeet.khater@gmail.com','Teddy')

    user_datastore.add_role_to_user('donkimber@gmail.com', 'admin')

    print "------------------------------------------"


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
    return render_template("worldviews.html")


#@login_failed.connect_via(app):
@login_failed.connect_via(app)
def on_login_failed(sender, provider, oauth_response):
    """
    This gets called when a user tries a social login and it
    is not associated with a 'connection' to any social provider.
    We will attempt to create a new account for the user.
    """
    print "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
    connection_values = get_connection_values_from_oauth_response(provider, oauth_response)
    print "provider:", provider
    print connection_values
    provider_id = connection_values.get('provider_id', None)
    full_name = connection_values['full_name']
    uid = connection_values['provider_user_id']
    email = connection_values.get('provider_email', None)
    if provider_id == 'facebook':
        if not email:
            email = "fb_%s_%s@unknown.com" % (uid, full_name.replace(' ', '_'))
    elif provider_id == 'twitter':
        if not email:
            uname = connection_values['display_name'].replace(' ','_')
            uname = uname.replace('@','')
            email = "tw_%s_%s@unknown.com" % (uid, uname)
    elif provider_id == 'google':
        if not email:
            email = "g_%s_%s@unknown.com" % (uid, full_name.replace(' ', '_'))
    else:
        print "***** Unknown provider id"
    print "**** Getting user"
    user = findOrAddUser(email, full_name)
    #db.session.commit()
    connection_values['user_id'] = user.id
    # Todo: add connection object to remember this
    # provider info for this user...
    #connect_handler(connection_values, provider)
    login_user(user)
    #db.session.commit()
    """
    ds = current_app.security.datastore
    user = ds.create_user( ... ) #fill in relevant stuff here
    ds.commit()
    connection_values['user_id'] = user.id
    connect_handler(connection_values, provider)
    login_user(user)
    db.commit()
    """
    return render_template("worldviews.html")

@app.route('/profile')
@login_required
def profile():
    notreqs = NOTIFIER.getNotificationRequests()
    print "notreqs:", notreqs
    return render_template(
        'profile.html',
        content='Profile Page',
        twitter_conn=social.twitter.get_connection(),
        facebook_conn=social.facebook.get_connection(),
        notreqs = notreqs,
        #foursquare_conn=social.foursquare.get_connection()
    )

@app.route('/notifications/clear')
@login_required
def notificationsClear():
    email = current_user.email
    print "notificationsClear", email
    #NOTIFIER.deleteRequests()
    NOTIFIER.deleteRequests({'email': email})
    return redirect('/profile')

@app.route('/notifications/add')
@login_required
def notificationsAdd():
    email = current_user.email
    print "notificationsAdd", email
    NOTIFIER.deleteRequests({'email': email})
    NOTIFIER.addRequest(
        {'email': email,
         'pattern': {'eventType': 'newChatPost'},
         'method': 'email'})
    NOTIFIER.addRequest(
        {'email': email,
         'pattern': {'eventType': 'newComment'},
         'method': 'email'})
    return redirect('/profile')

@app.route('/TeleViewer')
@app.route('/televiewer')
def televiewer():
    return render_template("TV.html")
    """
    path = "TeleViewer.html"
    print "path:", path
    return send_from_directory('static', path)
    """


"""
This is used by SharedCam to register itself with us.
"""
@app.route('/regp/', methods=['POST','GET'])
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

@app.route("/WV/<path:path>")
def getPage(path):
    return render_template(path+".html")

@app.route('/Viewer/TV')
def viewerTV():
    print "viewerTV"
#    return send_from_directory('Viewer', "TV.html")
    return render_template("TV.html")

@app.route('/Viewer/<path:path>')
def send(path):
    print "send_page", path
    return send_from_directory('Viewer', path)

@app.route('/images/<path:path>')
def send_image(path):
    print "send_image", path
    return send_from_directory('images', path)

@app.route('/Cesium/<path:path>')
def send_page(path):
    print "send_page", path
    return send_from_directory('Cesium', path)

@app.route('/play/<path:path>')
def send_play(path):
    print "send_play", path
    return send_from_directory('play', path)

@app.route('/static/<path:path>')
def send_static(path):
    print "send_static", path
    return send_from_directory('static', path)

@app.route('/log')
@login_required
def log_on():
    print "log_on"
    return redirect('/Viewer/TV')
#    render_template('TV.html')

"""
This URL is a gateway for posting to SIO
"""
@app.route('/sioput/<path:etype>', methods=['POST','GET'])
def sioput(etype):
    req = {}
    args = request.args
    if request.data:
        req = json.loads(request.data)
    for key in args:
        req[key] = args[key][0]
    print "req:", req
    etype0 = req['etype']
    if etype0 != etype:
        print "mismatch etype:", etype
    obj = req['obj']
    #jObj = json.dumps(obj)
    jObj = jsondumps(obj)
    print "etype:", etype
    print "jObj:", jObj
    if socketio:
        print "send to socketio"
        emit(etype, jObj, broadcast=True, namespace='/')
    print "**** addToDB"
    addObjToDB(obj, etype)
    print
    return "OK"

@app.route('/comment/<path:etype>', methods=['POST','GET'])
def addComment(etype):
    print "addComment", etype
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


###################################################################
#
# SocketIO bindings
#
#@socketio.on('my event')
#def test_message(message):
#    emit('my response', {'data': 'got it!'})

@socketio.on('chat')
def handle_chat(msg):
    print "handle_chat:", msg
    emit('chat', msg, broadcast=True)
    #DBA.addMsgStrToDB(msg, 'chat')
    msgObj = json.loads(msg)
    DBA.addObjToDB(msgObj, 'chat')
    if NOTIFIER:
        NOTIFIER.noticeNewChatPost(msgObj)

@socketio.on('notes')
def handle_notes(msgStr):
    print "handle_notes:", msgStr
    emit('notes', msgStr, broadcast=True)
    #DBA.addMsgStrToDB(msg, 'notes')
    note = json.loads(msgStr)
    DBA.addObjToDB(note, 'notes')
    if NOTIFIER:
        NOTIFIER.noticeNewNote(note)

@socketio.on('people')
def handle_people(msg):
    #print "handle_people:", msg
    emit('people', msg, broadcast=True)
    obj = json.loads(msg)
    userId = obj['userId']
    isNew = userId not in USER_TIMES
    USER_TIMES[obj['userId']] = obj
    if isNew and NOTIFIER:
        NOTIFIER.noticeNewUser(obj)

@socketio.on('sharecam')
def handle_sharecam(msg):
    #print "handle_sharecam:", msg
    emit('sharecam', msg, broadcast=True)


def run():
    print "Running flask server"
    socketio.run(app, host="0.0.0.0", port=80)
    #socketio.run(app, port=80)

if __name__ == '__main__':
    run()

