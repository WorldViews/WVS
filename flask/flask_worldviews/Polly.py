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

@app.route('/polly')
def polly():
    return redirect("/static/polly/Polly2.html")

@app.route('/polly/stats')
def pollyStats():
    print "pollyStats"
    return jsonify(POLLY_MSGS_BY_TYPE)

def handlePollyRequest(msg):
    print "handlePollyRequest", msg
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

