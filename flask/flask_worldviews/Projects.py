# Define models

from flask import redirect, request, render_template, Response
import jsonHack
from jsonHack import jsonify, jsondumps
#from flask_security import current_user
from flask_worldviews.util import gen_json
from flask_worldviews import db, app
from flask_worldviews.Accounts import admin, User, MyModelView, getUserById, getUserByStr
from wtforms import Form, StringField, FloatField
import mongoengine
import time

class Project(db.Document):
    title = db.StringField(max_length=200)
    description = db.StringField()
    members = db.ListField(db.ReferenceField(User), default=[])
    followers = db.ListField(db.ReferenceField(User), default=[])
    creation_time = db.FloatField(default=0)
    modification_time = db.FloatField(default=0)

    def __unicode__(self):
        return "Project #%s" % (self.title)

    def getJson(self):
        obj = {}
        for key,v in self._data.items():
            print key, v
            if type(v) == type([]):
                pass
            else:
                obj[key] = v
        print
        return obj
        #return json.dumps(obj, indent=4)

admin.add_view(MyModelView(Project))

@app.route('/projects_add', methods=['POST'])
def projectsAdd():
    print "addProject..."
    form = request.form
    title = form['title']
    print "title:", title
    desc =  form['description']
    print "desc:", desc
    owner = form['owner']
    owner = getUserById(owner)
    print "owner:", owner
    proj = Project(title=title, description=desc)
    print "members:", proj.members
    if owner not in proj.members:
        proj.members.append(owner)
    proj.creation_time = time.time()
    proj.save()
    print "got project", proj
    projs = Project.objects.all()
    return render_template("projects.html", projs=projs)

@app.route('/project_edit', methods=['GET', 'POST'])
def projectEdit():
    print "projectEdit"
    if request.method == "GET":
        projectId = request.args.get('id')
    else:
        form = request.form
        projectId = form['projectId']
    print "projectId:", projectId
    #print "userId:", current_user.id
    proj = Project.objects(id=projectId).first()
    return render_template("project_edit.html", proj=proj)

@app.route('/project_update', methods=['POST'])
def projectUpdate():
    print "projectUpdate"
    projectId = request.form['projectId']
    title =     request.form['title']
    desc =      request.form['description']
    print "projectId:", projectId
    print "title:", title
    print "desc:", desc
    proj = Project.objects(id=projectId).first()
    proj.description = desc
    proj.title = title
    proj.modification_time = time.time()
    proj.save()
    return redirect("/projects")


@app.route('/project_follow', methods=['POST'])
def projectsFollow():
    print "projectsFollow"
    form = request.form
    projectId = form['projectId']
    userId = form['userId']
    print "projectId:", projectId
    print "userId:", userId
    proj = Project.objects(id=projectId).first()
    user = getUserById(userId)
    if user not in proj.followers:
        proj.followers.append(user)
        proj.save()
    print "title:", proj.title
    return redirect("/projects")

@app.route('/project_unfollow', methods=['POST'])
def projectsUnFollow():
    print "projectsUnFollow"
    form = request.form
    projectId = form['projectId']
    userId = form['userId']
    print "projectId:", projectId
    print "userId:", userId
    proj = Project.objects(id=projectId).first()
    user = getUserById(userId)
    if user in proj.followers:
        proj.followers.remove(user)
        proj.save()
    print "title:", proj.title
    return redirect("/projects")

@app.route('/project_join', methods=['POST'])
def projectJoin():
    print "projectJoin"
    #form = request.get_json()
    form = request.form
    #form = request.form
    print "form:", form
    projectId = form['projectId']
    userId = form['userId']
    print "projectId:", projectId
    print "userId:", userId
    proj = Project.objects(id=projectId).first()
    user = getUserById(userId)
    if user not in proj.members:
        proj.members.append(user)
        proj.save()
    proj.save()
    print "title:", proj.title
    return redirect("/projects")

@app.route('/project_leave', methods=['POST'])
def projectLeave():
    print "projectLeave"
    form = request.form
    projectId = form['projectId']
    userId = form['userId']
    print "projectId:", projectId
    print "userId:", userId
    proj = Project.objects(id=projectId).first()
    user = getUserById(userId)
    if user in proj.members:
        proj.members.remove(user)
        proj.save()
    proj.save()
    return redirect("/projects")

@app.route('/projectsRaw')
def projectsRaw():
    projs = Project.objects.all()
    if request.args.get("type",None) == "json":
        #jstr = gen_json(list(projs))
        jstr = gen_json(list(projs), visible={User: ["name", "id", "email"]})
        return Response(jstr, mimetype="application/json")
    return render_template("projects.html", projs=projs,list=list)

@app.route('/projects')
def projects():
    #projs = Project.objects.all()
    if request.args.get("type",None) == "json":
        projs = Project.objects.all()
        #jstr = gen_json(list(projs))
        jstr = gen_json(list(projs), visible={User: ["name", "id", "email"]})
        return Response(jstr, mimetype="application/json")
    return render_template("projects_json.html")

@app.route('/rprojects')
def rprojects():
    #projs = Project.objects.all()
    #print "userId:", current_user.id
    return render_template("projects_react.html")
    #return render_template("projects_react.html", current_user_id=current_user.id)


