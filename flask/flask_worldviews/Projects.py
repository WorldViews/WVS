# Define models

from flask import redirect, request, render_template
from jsonHack import jsonify, jsondumps
from flask_worldviews import db, app

@app.route('/projects')
def projects():
    return render_template("projects.html")


