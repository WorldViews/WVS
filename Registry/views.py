from django.http import HttpResponse, HttpResponseRedirect, HttpResponsePermanentRedirect
from django.shortcuts import redirect, render_to_response, render
from django.template import RequestContext
from django.db import connection, transaction
from django.core.urlresolvers import reverse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.sites.models import Site
from django.utils import timezone
from datetime import datetime
from django.db.models import Max
from django.utils.dateformat import format
from django.contrib.auth import logout as auth_logout
from django.conf import settings

#from jumpchat.socketio_ns import V1Namespace
import ShareCamReg
import string
import random
import logging
from datetime import date
#import jumpchat.utils
import json
import os
from models import *

def toBool(val):
    if val in ["true","True"]:
        return True
    if val in ["false","False"]:
        return False
    if val:
        return True
    return False


def index(request):
    return render_to_response('index.html', locals(), RequestContext(request))

def about(request):
    return render_to_response('about.html', locals(), RequestContext(request))

def projects(request):
    projs = Project.objects.all()
    return render_to_response('projects.html', locals(), RequestContext(request))

@csrf_exempt
def addproj(request):
    q = request.POST
    req = dict(q)
    username = req['username'][0]
    title = req['title'][0]
    desc = req['description'][0]
    p = Project(title=title, description=desc)
    p.save()
    req['gotUsername'] = username
    user = User.objects.filter(username=username)[0]
    p.members.add(user)
    jsonStr = json.dumps(req)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def joinproj(request):
    q = request.POST
    req = dict(q)
    username = req['username'][0]
    name = req['name'][0]
    p = Project.objects.filter(name=name)[0]
    req['gotProj'] = p.name;
    user = User.objects.filter(username=username)[0]
    req['gotUsername'] = username
    p.members.add(user)
    p.followers.add(user)
    jsonStr = json.dumps(req)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def followproj(request):
    q = request.POST
    req = dict(q)
    username = req['username'][0]
    name = req['name'][0]
    p = Project.objects.filter(name=name)[0]
    req['gotProj'] = p.name;
    user = User.objects.filter(username=username)[0]
    req['gotUsername'] = username
    p.followers.add(user)
    jsonStr = json.dumps(req)
    return HttpResponse(jsonStr, content_type="application/json")

def members(request):
    return render_to_response('members.html', locals(), RequestContext(request))

def inspirations(request):
    return render_to_response('inspirations.html', locals(), RequestContext(request))

@csrf_exempt
def mapview(request):
    return render_to_response("mapview.html", locals(), RequestContext(request))

@csrf_exempt
def globeview(request):
    return render_to_response("globeview.html", locals(), RequestContext(request))
#    return render_to_response("cesium.html", locals(), RequestContext(request))

@csrf_exempt
def reg_remove(request):
    q = request.GET
    params = {'room': '', 'type': 'random', 'serverName': settings.JUMPCHAT_SERVER, 'apiKey': settings.API_KEY  }
    jsonStr = ShareCamReg.regRemove(request, params, q)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def reg_connect(request):
    q = request.GET
    params = {'room': '', 'type': 'random', 'serverName': settings.JUMPCHAT_SERVER, 'apiKey': settings.API_KEY  }
    url = ShareCamReg.regConnect(request, params, q)
    return HttpResponseRedirect(url)

@csrf_exempt
def reg_query(request):
    q = request.GET
    params = {'room': '', 'type': 'random', 'serverName': settings.JUMPCHAT_SERVER, 'apiKey': settings.API_KEY  }
    jsonStr = ShareCamReg.regQuery(request, params, q)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_exempt
def reg_config(request):
    q = request.GET
    config = {'type': 'random', 'serverName': settings.JUMPCHAT_SERVER }
    if "name" in q:
        name = q['name']
        path = "registry/config/%s.json" % (name,)
        config['name'] = name
        try:
            cfg = json.loads(file(path).read())
            for key in cfg:
                config[key] = cfg[key]
            config['configPath'] = path
        except:
            pass
    jsonStr = json.dumps(config)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def reg_becomeguide(request):
    return render_to_response("becomeguide.html", locals(), RequestContext(request))

@csrf_exempt
def reg_notification(request):
    return render_to_response("notification.html", locals(), RequestContext(request))

@csrf_exempt
def reg_getNotification(request):
    obj = {}
    q = request.GET
    if "name" in q:
        name = q['name']
        path = "notifications/records/%s.json" % (name,)
        obj['name'] = name
        obj['configPath'] = path
        try:
            cfg = json.loads(file(path).read())
            for key in cfg:
                obj[key] = cfg[key]
        except:
            obj['error'] = 'could not get values'
    else:
        obj['error'] = 'no name specified'
    jsonStr = json.dumps(obj)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def reg_setNotification(request):
    obj = {}
    q = request.GET
    obj['pattern_tags'] = q.get("pattern_tags", "")
    obj['active'] = toBool(q.get("active", False))
    obj['notifyByEmail'] = toBool(q.get("notifyByEmail", False))
    obj['notifyBySMS'] = toBool(q.get("notifyBySMS", False))
    obj['email'] = q.get("email", "")
    obj['phone'] = q.get("phone", "")
    obj['sms_carrier'] = q.get("sms_carrier", "")
    if "name" in q:
        name = q['name']
        path = "notifications/records/%s.json" % (name,)
        obj['name'] = name
        obj['configPath'] = path
        try:
            json.dump(obj, file(path,"w"))
        except:
            obj['error'] = 'could not save values'
    else:
        obj['error'] = 'no name specified'
    jsonStr = json.dumps(obj)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def reg_delNotification(request):
    obj = {}
    q = request.GET
    if "name" in q:
        name = q['name']
        path = "notifications/records/%s.json" % (name,)
        obj['name'] = name
        obj['configPath'] = path
        try:
            os.unlink(path)
        except:
            obj['error'] = 'could not delete notification'
    else:
        obj['error'] = 'no name specified'
    jsonStr = json.dumps(obj)
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def reg(request):
    params = {'room': '', 'type': 'random', 'serverName': settings.JUMPCHAT_SERVER, 'apiKey': settings.API_KEY  }
    jsonStr = ShareCamReg.reg(request, params)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

# Post version of reg
@csrf_exempt
def regp(request):
    params = {'room': '', 'type': 'random', 'serverName': settings.JUMPCHAT_SERVER, 'apiKey': settings.API_KEY  }
    jsonStr = ShareCamReg.regp(request, params)
#    jsonStr = json.dumps({'return_code': 'failed'})
    return HttpResponse(jsonStr, content_type="application/json")

@csrf_exempt
def reg_getrequests(request):
    requests = Request.objects.filter()
    reqObjs = [req.getDict() for req in requests]
    jsonStr = json.dumps(reqObjs)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_exempt
def reg_getguides(request):
    guides = Guide.objects.filter()
    gObjs = [g.getDict() for g in guides]
    jsonStr = json.dumps(gObjs)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_exempt
def reg_getsessions(request):
    sessions = Session.objects.filter()
    sObjs = [s.getDict() for s in sessions]
    jsonStr = json.dumps(sObjs)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_exempt
def requestform(request):
    return render_to_response("requestform.html", locals(), RequestContext(request))

def optionalFloat(f):
    if f:
        return float(f)
    return f

@csrf_exempt
def reg_addrequest(request):
    q = request.GET
    args = {}
    args['user_id'] = q.get('user_id', 1)
    args['text'] = q.get('text', None)
    args['latitude'] = optionalFloat(q.get('latitude', None))
    args['longitude'] = optionalFloat(q.get('longitude', None))
    req = Request(**args)
    req.save()
    obj = args
    obj['return'] = 'ok'
    jsonStr = json.dumps(obj)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_exempt
def reg_addguide(request):
    q = request.GET
    args = {}
    args['name'] = q.get('name', None)
    args['text'] = q.get('text', None)
    args['latitude'] = optionalFloat(q.get('latitude', None))
    args['longitude'] = optionalFloat(q.get('longitude', None))
    tags = q.get('tags', None)
    guide = Guide(**args)
    guide.save()
    obj = args
    obj['return'] = 'ok'
    jsonStr = json.dumps(obj)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_exempt
def reg_addsession(request):
    q = request.GET
    args = {}
    args['name'] = q.get('name', None)
    args['text'] = q.get('text', None)
    args['latitude'] = optionalFloat(q.get('latitude', None))
    args['longitude'] = optionalFloat(q.get('longitude', None))
    tags = q.get('tags', None)
    """
    session = Session(**args)
    session.save()
    """
    obj = args
    obj['return'] = 'ok'
    jsonStr = json.dumps(obj)
    response = HttpResponse(jsonStr, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response


def login(request):
    return render_to_response('login.html', locals(), RequestContext(request))

def logout(request):
    auth_logout(request)
    return redirect('index')

