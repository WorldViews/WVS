
import flask_worldviews
from flask_worldviews.Projects import *


p = Project
projs = p.objects()
print projs
p0 = projs[0]
#print p0.to_json()
print
#print p0.getJson()
print me_to_dict(p0)

