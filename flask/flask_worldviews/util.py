
# Define models

from flask import redirect, request, render_template, Response
import jsonHack
from jsonHack import jsonify, jsondumps
from flask_worldviews import db
import mongoengine

"""
This function generates an object compatible with JSON (i.e. a primitive
type, list or dictionary of compatible objects) from a mongoengine
object.  This expands object references or list references to crawl
into other objects.  By default it reveals all fields of the objects
involved.  This can be overridden by giving a visible argument, which
is a dictionary mapping class to fields that are exposed.
e.g.
visible = {'User': ['id', 'name']}
will cause only those fields of User objects to be shown.
"""
def gen_obj(obj, visible={}):
    if hasattr(obj, "gen_obj"):
        return obj.gen_obj()
    if hasattr(obj, "_fields"):
        #print "Looping _fields obj is ", obj.__class__
        robj = {}
        for key in obj._fields:
            if obj.__class__ in visible:
                if key not in visible[obj.__class__]:
                    continue
            if isinstance(obj._fields[key], mongoengine.fields.ListField):
                robj[key] = [gen_obj(x,visible) for x in obj[key]]
            else:
                robj[key] = gen_obj(obj[key], visible)
        robj['_type'] = obj.__class__.__name__
        return robj
    if type(obj) == type([]):
        #print "Mapping over list"
        return [gen_obj(x,visible) for x in obj]
    return obj

def gen_json(obj, visible={}):
    return jsonHack.dumps(gen_obj(obj, visible), indent=4)

