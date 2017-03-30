from flask import jsonify, request
from flask_worldviews import app
from flask_worldviews.models.tracks import Track

@app.route('/api/v1/track')
def track_list():

    tracks = [ '{}/{}'.format(request.url, t.name) for t in Track.objects.all() ]
    return jsonify({
        'tracks': tracks
    })

@app.route('/api/v1/track/<string:name>')
def track_item(name):
    try:
        track = Track.objects.get(name=name)
        return jsonify(track)
    except Exception:
        message = {
                'status': 404,
                'message': 'Not Found: ' + request.url,
        }
        resp = jsonify(message)
        resp.status_code = 404
        return resp
