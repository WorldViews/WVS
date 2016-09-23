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

@socketio.on('polly')
def handle_sio_polly_message(msg):
    print "handle_sio_polly_message:", msg
    print "type:", type(msg)
    emit('polly', msg, broadcast=True)

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

