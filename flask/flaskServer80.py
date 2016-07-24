"""
This is a version of the flask server with users and
authentication, and also it is registerable or trackable.
"""
import json, time, traceback, socket
import flask
import Queue

from flask import Flask, render_template, send_file, redirect, \
                  jsonify, send_from_directory, request
from flask_socketio import SocketIO, emit
from flask_mail import Mail

TABLE_NAMES = ["chat", "notes", "periscope"]

DB_REQUEST_TIMES = {}
USER_TIMES = {}

NUM_CONNS = 5
POOL = Queue.Queue(NUM_CONNS)

rdb = None
try:
    import rethinkdb as rdb
    #rdb.connect('localhost', 28015).repl()
    for i in range(NUM_CONNS):
        print "Getting connection"
        conn_ = rdb.connect(db='test')
        POOL.put(conn_)
    print "**** Connection pool has %d connections ****" % POOL.qsize()
except:
    traceback.print_exc()
    print "*** Running without DB ***"
    rdb = None

def getConn():
    print "getConn..."
    conn = POOL.get()
    cnt = POOL.qsize()
    print "POOL count", cnt, " conn:", conn
    return conn

def releaseConn(conn):
    print "releasing Conn:", conn
    POOL.put(conn)
    return

app = Flask(__name__, static_url_path='')
app.debug = True
#app.debug = False
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wv.db'

app.config['SECURITY_TRACKABLE'] = True
app.config['SECURITY_REGISTERABLE'] = True
app.config['SECURITY_EMAIL_SENDER'] = 'no-reply@pollywss.paldeploy.com'

app.config['MAIL_SERVER'] = '192.168.20.18'
app.config['MAIL_PORT'] = 25
#app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'flycam'
app.config['MAIL_PASSWORD'] = 'flyspec'
mail = Mail(app)

socketio = SocketIO(app)

"""
# Create database connection object
db = SQLAlchemy(app)

# Define models
roles_users = db.Table('roles_users',
        db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
        db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    name = db.Column(db.String(255))
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime())
    last_login_at = db.Column(db.DateTime())
    current_login_at = db.Column(db.DateTime())
    # Why 45 characters for IP Address ?
    # See http://stackoverflow.com/questions/166132/maximum-length-of-the-textual-representation-of-an-ipv6-address/166157#166157
    last_login_ip = db.Column(db.String(45))
    current_login_ip = db.Column(db.String(45))
    login_count = db.Column(db.Integer)
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))

# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

# Create a user to test with
@app.before_first_request
def create_user():
    print "------------------------------------------"
    print "Creating tables and user entries"
    db.create_all()
    if User.query.count() > 0:
        print ">>>>>>>>>> Tables already initialized.... <<<<<<<<<<<"
        return
    user_datastore.create_user(email='donkimber@gmail.com',
                               password='xxx',
                               name="Don")
    user_datastore.create_user(email='enockglidden@hotmail.com',
                               password='xxx',
                               name="Enock")
    user_datastore.create_user(email='sinasareth@yahoo.com',
                               password='xxx',
                               name="Sina")
    user_datastore.create_user(email='doczeno@yahoo.com',
                               password='xxx',
                               name="doczeno")
    user_datastore.create_user(email='vaughan@fxpal.com',
                               password='xxx',
                               name="Jim")
    user_datastore.create_user(email='indrajeet.khater@gmail.com',
                               password='xxx',
                               name="Teddy")
    db.session.commit()
    print "------------------------------------------"
"""

def getObj(id, tname):
    print "getObj", id, tname
    obj = None
    try:
        conn = getConn()
        recs = rdb.table(tname).filter({'id': id}).run(conn)
        obj = recs.next()
    finally:
        releaseConn(conn)
    return obj

def getNote(id):
    return getObj(id, 'notes')
    
@app.route('/')
def index():
    print "index ****"
    page = "index.html"
    if socket.gethostname() == "tours.xcloud.fxpal.net":
        page = "landing.html"
    return send_file(page)


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
    jstr = json.dumps(obj)
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

"""
@app.route('/log')
def log_on():
    print "log_on"
    return redirect('/Viewer/TV')
#    render_template('TV.html')
"""

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
    jObj = json.dumps(obj)
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
    note = getNote(parentId)
    print "note:", note
    comments = note.get("comments", [])
    comments.append(comment)
    print "comments:", comments
    note['comments'] = comments
    jObj = json.dumps(note)
    print "etype:", etype
    print "jObj:", jObj
    if socketio:
        print "send to socketio"
        emit(etype, jObj, broadcast=True, namespace='/')
    print "**** addToDB"
    replaceObjToDB(note, etype)
    print
    return flask.jsonify({'status': 'OK'})

@app.route('/db/<path:etype>')
def query(etype):
    global DB_REQUEST_TIMES
    print "query", etype
    t = time.time()
    DB_REQUEST_TIMES[etype] = t
    if rdb == None:
        return flask.jsonify({'error': 'No DB', 't': t, 'records': []})
    args = request.args
    id = args.get("id", None)
    tMin = args.get("tMin", None)
    limit = args.get("limit", None)
    if limit != None:
        limit = int(limit)
    if tMin != None:
        tMin = float(tMin)
    try:
        q = rdb.table(etype)
        if id != None:
            q = q.filter({'id': id})
        if tMin != None:
            q = q.filter(rdb.row["t"].gt(tMin))
        q = q.order_by(rdb.desc('t'))
        if limit != None:
            q = q.limit(limit)
        print q
        try:
            conn = getConn()
            recs = q.run(conn)
            items = list(recs)
        finally:
            releaseConn(conn)
    except:
        traceback.print_exc()
        return flask.jsonify({})
    items = list(recs)
    obj = {'type': etype,
           't' : t,
           'records': items}
    return flask.jsonify(obj)

"""
This returns an object that gives the most recent request
for a table by type of table.   It is intended as a mechanism
for event Watcher streams to know when their kinds of events
are requested.
"""
@app.route('/dbstats/')
def dbstats():
    return flask.jsonify(DB_REQUEST_TIMES)

@app.route('/userstats/')
def userstats():
    return flask.jsonify(USER_TIMES)



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
    addMsgStrToDB(msg, 'chat')

@socketio.on('notes')
def handle_notes(msg):
    print "handle_notes:", msg
    emit('notes', msg, broadcast=True)
    addMsgStrToDB(msg, 'notes')

@socketio.on('people')
def handle_people(msg):
    #print "handle_people:", msg
    emit('people', msg, broadcast=True)
    obj = json.loads(msg)
    USER_TIMES[obj['userId']] = obj

@socketio.on('sharecam')
def handle_sharecam(msg):
    #print "handle_sharecam:", msg
    emit('sharecam', msg, broadcast=True)

def addMsgStrToDB(msgStr, etype):
    print "add Msg to DB:", etype
    if etype not in TABLE_NAMES:
        print "**** addMsgStrToDB unknown table:", etype
        return
    obj = json.loads(msgStr)
    if rdb == None:
        print "*** not connected to DB ***"
    try:
        conn = getConn()
        rdb.table(etype).insert(obj).run(conn)
    finally:
        releaseConn(conn)

def addObjToDB(obj, etype):
    print "add Obj to DB:", etype
    print "obj:", obj
    if etype not in TABLE_NAMES:
        print "**** addObjToDB: unknown table:", etype
        return
    try:
        conn = getConn()
        rc = rdb.table(etype).insert(obj).run(conn)
        print "Completed insert", rc
    finally:
        releaseConn(conn)

def replaceObjToDB(obj, etype):
    print "add Obj to DB:", etype
    print "obj:", obj
    if etype not in TABLE_NAMES:
        print "**** addObjToDB: unknown table:", etype
        return
    try:
        conn = getConn()
        rc = rdb.table(etype).replace(obj).run(conn)
    finally:
        releaseConn(conn)
    print "Completed insert", rc

def run():
    print "Running flask server"
    socketio.run(app, host="0.0.0.0", port=80)
    #socketio.run(app, port=80)

if __name__ == '__main__':
    run()

