
import flask_worldviews
from flask_worldviews.Projects import Project
from flask_worldviews.Accounts import User

proj = Project.objects(name= "wvtechdev").first()
user = User.objects(email="donkimber@gmail.com").first()
print user
print proj
if user not in proj.members:
    proj.members.append(user)
    proj.save()

print "members:", proj.members
for member in proj.members:
    print member.full_name

