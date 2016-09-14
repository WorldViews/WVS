# Define models

from flask import redirect, request, render_template
from jsonHack import jsonify, jsondumps
from flask_worldviews import db, app
from flask_worldviews.Accounts import admin, User, MyModelView, getUserById
from wtforms import Form, StringField

class Project(db.Document):
    title = db.StringField(max_length=200)
    description = db.StringField()
    members = db.ListField(db.ReferenceField(User), default=[])
    followers = db.ListField(db.ReferenceField(User), default=[])

    def __unicode__(self):
        return "Project #%s" % (self.title)

admin.add_view(MyModelView(Project))

@app.route('/projects_add', methods=['POST'])
def projectsAdd():
    print "addProject..."
    form = request.form
    title = form['title']
    desc =  form['description']
    ownerId = form['owner']
    print "title:", title
    print "desc:", desc
    print "ownerId:", ownerId
    owner = getUserById(ownerId)
    proj = Project(title=title, description=desc)
    print "members:", proj.members
    proj.members.append(owner)
    proj.save()
    print "got project", proj
    projs = Project.objects.all()
    return render_template("projects.html", projs=projs)


@app.route('/projects_follow', methods=['POST'])
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

@app.route('/projects_join', methods=['POST'])
def projectsJoin():
    print "projectsJoin"
    form = request.form
    projectId = form['projectId']
    userId = form['userId']
    print "projectId:", projectId
    print "userId:", userId
    proj = Project.objects(id=projectId).first()
    user = getUserById(userId)
    if user not in proj.members:
        proj.members.append(user)
        proj.save()
    print "title:", proj.title
    return redirect("/projects")

@app.route('/projects')
def projects():
    projs = Project.objects.all()
    return render_template("projects.html", projs=projs)

