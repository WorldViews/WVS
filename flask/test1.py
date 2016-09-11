import flaskAuthServer80 as WVS

users = WVS.User.query.filter(WVS.User.email == 'donkimber@gmail.com')
for user in users:
    print user
    print user.email

