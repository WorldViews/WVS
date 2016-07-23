import flaskAuthServer80 as S

S.socketio.run(S.app, host="0.0.0.0", port=9000)

