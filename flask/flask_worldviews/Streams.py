"""
This module handles SocketIO message passing

"""
import json
from flask import redirect, request, render_template
from jsonHack import jsonify, jsondumps
from flask_worldviews import db, app, socketio
from flask_worldviews import USER_TIMES, NOTIFIER, DBA
from flask_socketio import emit

###################################################################
# SocketIO related section

"""
This URL is a gateway for posting to SIO.
It is needed because unfortunately the python socketio
client is not compatible with the socketio server running
here.  So python scripts that want to send msgs into the
socketio stream can do a POST or GET to this url, which
will emit it into the stream, and add to DB as needed.
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
    DBA.addObjToDB(obj, etype)
    print
    return "OK"

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

"""
###############################################
# these are just to test android_chat sample
#
@socketio.on('add user')
def handle_sio_add_user(msg):
    print "handle_add_user:", msg
    msg = {'numUsers': 1, 'user': 'xxx'}
    emit('login', msg, broadcast=True)

@socketio.on('login')
def handle_sio_login(msg):
    print "handle_sio_login:", msg

@socketio.on('new message')
def handle_sio_new_message(msg):
    print "handle_sio_new_message:", msg

@socketio.on('polly')
def handle_sio_polly_message(msg):
    print "handle_sio_polly_message:", msg
    emit('polly', msg, broadcast=True)
"""



