# Define models

from flask import redirect, request, render_template
from jsonHack import jsonify, jsondumps
from flask_worldviews import db, app
from flask_worldviews.Accounts import User

class Project(db.Document):
    name = db.StringField(max_length=100, unique=True)
    title = db.StringField(max_length=200)
    description = db.StringField()
    members = db.ListField(db.ReferenceField(User), default=[])
    followers = db.ListField(db.ReferenceField(User), default=[])
    # tags
    #tags = models.ManyToManyField(Tag)

    def getDict(self):
        return {'name': self.name,
                'title': self.title,
                'description': self.description}

    def __unicode__(self):
        return "Project #%s" % (self.name)


@app.route('/projects')
def projects():
    projs = Project.objects.all()
    return render_template("projects.html", projs=projs)


