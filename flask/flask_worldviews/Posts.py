# Define models

from flask import redirect, request, render_template, Response
import jsonHack
from jsonHack import jsonify, jsondumps
from flask_worldviews.util import gen_json
from flask_worldviews import db, app
from flask_worldviews.Accounts import admin, User, MyModelView, getUserById, getUserByStr
from wtforms import Form, StringField, FloatField
import mongoengine

class Post(db.Document):
    title = db.StringField(max_length=200)
    description = db.StringField()
    author = db.ReferenceField(User)

admin.add_view(MyModelView(Post))

@app.route('/posts_add', methods=['POST'])
def postsAdd():
    print "addPost..."
    form = request.form
    title = form['title']
    print "title:", title
    desc =  form['description']
    print "desc:", desc
    author = form['author']
    author = getUserById(author)
    print "author:", author
    post = Post(title=title, description=desc, author=author)
    post.save()
    print "got post", post
    posts = Post.objects.all()
    return render_template("posts.html", posts=posts)

@app.route('/post_edit', methods=['GET', 'POST'])
def postEdit():
    print "postEdit"
    if request.method == "GET":
        postId = request.args.get('id')
    else:
        form = request.form
        postId = form['postId']
    print "postId:", postId
    #print "userId:", current_user.id
    post = Post.objects(id=postId).first()
    return render_template("post_edit.html", post=post)

@app.route('/post_update', methods=['POST'])
def postUpdate():
    print "postUpdate"
    postId = request.form['postId']
    title =     request.form['title']
    desc =      request.form['description']
    print "postId:", postId
    print "title:", title
    print "desc:", desc
    post = Post.objects(id=postId).first()
    post.description = desc
    post.title = title
    ppost.save()
    return redirect("/posts")


@app.route('/posts')
def posts():
    posts = Post.objects.all()
    if request.args.get("type",None) == "json":
        jstr = gen_json(list(posts), visible={User: ["name", "id", "email"]})
        return Response(jstr, mimetype="application/json")
    return render_template("posts.html", posts=posts,list=list)

@app.route('/jposts')
def jposts():
    return render_template("posts_json.html")


