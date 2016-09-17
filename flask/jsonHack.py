"""
https://gist.github.com/akhenakh/2954605
"""
'''
try:
    import simplejson as json
except ImportError:
    try:
        import json
    except ImportError:
        raise ImportError
'''
import json
import datetime
from bson.objectid import ObjectId
from werkzeug import Response

class MongoJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, ObjectId):
            return unicode(obj)
        return json.JSONEncoder.default(self, obj)

def jsondumps(*args, **kwargs):
    return json.dumps(dict(*args, **kwargs), cls=MongoJsonEncoder)

def dumps(obj, **kwargs):
    return json.dumps(obj, cls=MongoJsonEncoder, **kwargs)

def jsonify(*args, **kwargs):
    """ jsonify with support for MongoDB ObjectId
    """
    #return Response(json.dumps(dict(*args, **kwargs), cls=MongoJsonEncoder), mimetype='application/json')
    return Response(jsondumps(*args, **kwargs), mimetype='application/json')

