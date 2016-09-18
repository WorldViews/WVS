# Define models

from flask import redirect, request, render_template, Response
import jsonHack
from jsonHack import jsonify, jsondumps
from flask_worldviews.util import gen_json
from flask_worldviews import db, app
from flask_worldviews.Accounts import admin, User, MyModelView, getUserById, getUserByStr
from wtforms import Form, StringField, FloatField
import mongoengine

class Project(db.Document):
    title = db.StringField(max_length=200)
    description = db.StringField()
    members = db.ListField(db.ReferenceField(User), default=[])
    followers = db.ListField(db.ReferenceField(User), default=[])

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

@app.route('/project_join', methods=['POST'])
def projectJoin():
    print "projectJoin"
    form = request.get_json()
    #form = request.form
    print "form:", form
    projectId = form['projectId']
    print "projectId:", projectId
    members = form['members']
    print "members:", members
    proj = Project.objects(id=projectId).first()
    for userStr in members:
        print "userStr:", userStr
        member = getUserByStr(userStr)
        if member not in proj.members:
            proj.members.append(member)
    proj.save()
    print "title:", proj.title
    return redirect("/projects")

@app.route('/projects')
def projects():
    projs = Project.objects.all()
    if request.args.get("type",None) == "json":
        #jstr = gen_json(list(projs))
        jstr = gen_json(list(projs), visible={User: ["name", "id", "email"]})
        return Response(jstr, mimetype="application/json")
    return render_template("projects.html", projs=projs,list=list)

@app.route('/jprojects')
def jprojects():
    projs = Project.objects.all()
    return render_template("projects_json.html")

