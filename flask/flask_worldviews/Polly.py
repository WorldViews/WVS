"""
This module handles SocketIO Polly message passing

"""
import json
from flask import redirect, request, render_template
from jsonHack import jsonify, jsondumps
from flask_worldviews import db, app, socketio
from flask_worldviews import USER_TIMES, NOTIFIER, DBA
from flask_socketio import emit

###################################################################
# SocketIO related section
POLLY_MSGS_BY_TYPE = {}
POLLY_LAST_REQUEST = None
POLLY_LAST_REQUEST_TIME = None
POLLY_CONTROL_TIMEOUT = 3
import time

@app.route('/polly')
def polly():
    return redirect("/static/polly/Polly2.html")

@app.route('/polly/stats')
def pollyStats():
    print "pollyStats"
    return jsonify(POLLY_MSGS_BY_TYPE)

def handlePollyRequest(msg):
    global POLLY_LAST_REQUEST_TIME, POLLY_LAST_REQUEST
    print "handlePollyRequest", msg
    if POLLY_LAST_REQUEST:
        print "Checking control..."
        dt = time.time() - POLLY_LAST_REQUEST_TIME
        print "dt:", dt
        prevUser = POLLY_LAST_REQUEST['user']
        print "prevUser:", prevUser
        if msg['user'] != prevUser and dt < POLLY_CONTROL_TIMEOUT:
            print "Must wait for", prevUser
            return
    # Grant this request
    POLLY_LAST_REQUEST = msg
    POLLY_LAST_REQUEST_TIME = time.time()
    msg['msgType'] = msg['requested.msgType']
    emit('polly', msg, broadcast=True)

@socketio.on('polly')
def handle_sio_polly_message(msg):
    print "handle_sio_polly_message:", msg
    msgType = msg.get("msgType", None)
    POLLY_MSGS_BY_TYPE[msgType] = msg
    if msgType == "polly.request":
        handlePollyRequest(msg)
    else:
        emit('polly', msg, broadcast=True, include_self=False)

#
# There are just for the android socket.io chat sample
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

