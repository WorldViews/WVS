# Define models

import re
from datetime import datetime
from flask import redirect, request, render_template
from jsonHack import jsonify, jsondumps
from flask_worldviews import db, app, NOTIFIER

from wtforms import Form, BooleanField, StringField, PasswordField, validators

from flask_security import Security, MongoEngineUserDatastore, \
    UserMixin, RoleMixin, login_required, current_user, login_user

from flask_security.forms import RegisterForm

import flask_social
from flask_social import Social, login_failed
from flask_social.utils import get_connection_values_from_oauth_response
from flask_social.datastore import MongoEngineConnectionDatastore

from flask_admin import Admin
from flask_admin.contrib.mongoengine import ModelView

class Role(db.Document, RoleMixin):
    name = db.StringField(max_length=80, unique=True)
    description = db.StringField(max_length=255)

class User(db.Document, UserMixin):
    #email = db.StringField(max_length=255, unique=True)
    email = db.StringField(max_length=255, unique=True)
    name = db.StringField(max_length=255)
    full_name = db.StringField(max_length=255)
    password = db.StringField(max_length=255)
    active = db.BooleanField(default=True)
    confirmed_at = db.DateTimeField()
    last_login_at = db.DateTimeField()
    current_login_at = db.DateTimeField()
    last_login_ip = db.StringField(max_length=45)
    current_login_ip = db.StringField(max_length=45)
    login_count = db.IntField()
    remember_token = db.StringField(max_length=255)
    authentication_token = db.StringField(max_length=255)
    roles = db.ListField(db.ReferenceField(Role), default=[])

    @property
    def connections(self):
        return Connection.objects(user_id=str(self.id))

    def __unicode__(self):
        return "%s" % (self.name)


class Connection(db.Document):
    user_id = db.ObjectIdField()
    provider_id = db.StringField(max_length=255)
    provider_user_id = db.StringField(max_length=255)
    provider_email = db.StringField(max_length=255)
    access_token = db.StringField(max_length=255)
    secret = db.StringField(max_length=255)
    full_name = db.StringField(max_length=255)
    display_name = db.StringField(max_length=255)
    profile_url = db.StringField(max_length=512)
    image_url = db.StringField(max_length=512)
    rank = db.IntField()

    @property
    def user(self):
        return User.objects(id=self.user_id).first()


# Setup Flask-Security
user_datastore = MongoEngineUserDatastore(db, User, Role)
connection_datastore = MongoEngineConnectionDatastore(db, Connection)

class ExtendedRegisterForm(RegisterForm):
    #first_name = StringField('First Name', [validators.Required()])
    #last_name = StringField('Last Name', [validators.Required()])
    name = StringField('Name', [validators.Required()])
    #full_name = StringField('Full Name', [validators.Required()])

class ExtendedConfirmRegisterForm(RegisterForm):
    name = StringField('Name', [validators.Required()])
    #full_name = StringField('Full Name', [validators.Required()])

#security = Security(app, user_datastore)
security = Security(app, user_datastore,
                    register_form=ExtendedRegisterForm,
                    confirm_register_form=ExtendedConfirmRegisterForm)
social = Social(app, connection_datastore)

admin = Admin(app)

class MyModelView(ModelView):
    def is_accessible(self):
        #return login.current_user.is_authenticated()
        #return current_user.is_authenticated()
        return current_user.has_role('admin')

    def inaccessible_callback(self, name, **kwargs):
        # redirect to login page if user doesn't have access
        print "****** redirect for login ******"
        return redirect(url_for('login', next=request.url))


admin.add_view(MyModelView(User))
admin.add_view(MyModelView(Role))
admin.add_view(MyModelView(Connection))

def addUser(email, name, full_name):
    print "**** addUser", email, name, full_name
    user = user_datastore.create_user(email=email,
                               full_name=full_name,
                               name=name,
                               password='xxxxxx',
                               confirmed_at = datetime.utcnow())
    user_datastore.add_role_to_user(email, 'end-user')
    return user

def findOrAddUser(email, full_name):
    print "**** findOrAddUser", email, full_name
    try:
        #user = User.query.filter_by(email=email).first()
        user = User.objects(email=email).first()
        if user:
            print "**** found user"
            return user
    except:
        print traceback.print_exc()
        pass
    name = full_name.split()[0]
    return addUser(email, name, full_name)

def getUserById(id):
    """
    Adding this is a hack to get social auth to work.
    """
    print "=================================="
    return User.objects(id=id).first()

def getUserByStr(str):
    if str.find("@") >= 0:
        return User.objects(email=str).first()
    if re.match("[0-9]+", str):
        return getUserById()
    return User.objects(name=str).first()

# Hack to get this visible in flask_social
#flask.ext.social.views.getUserById = getUserById
flask_social.views.getUserById = getUserById


# Create a user to test with
@app.before_first_request
def create_users():
    print "------------------------------------------"
    print "before first request"
    nUsers = User.objects.count()
    if nUsers > 0:
        print "Already have %d users" % nUsers
        return
    print "Creating tables and user entries"
    user_datastore.find_or_create_role(name='admin',
                                       description='Administrator')
    user_datastore.find_or_create_role(name='end-user',
                                       description='End user')
    addUser('donkimber@gmail.com',       'DonK',    'Don Kimber')
    addUser('doczeno@yahoo.com',         'DocZeno', 'Doc Zeno')
    addUser('enockglidden@hotmail.com',  'Enock',   'Enock Glidden')
    addUser('sinasareth@yahoo.com',      'Sina',    'Sina')
    addUser('vaughan@fxpal.com',         'JimV',    'Jim Vaughan')
    addUser('indrajeet.khater@gmail.com','Teddy',   'Indrajeet Khater')

    user_datastore.add_role_to_user('donkimber@gmail.com', 'admin')

    print "------------------------------------------"


#@login_failed.connect_via(app):
@login_failed.connect_via(app)
def on_login_failed(sender, provider, oauth_response):
    """
    This gets called when a user tries a social login and it
    is not associated with a 'connection' to any social provider.
    We will attempt to create a new account for the user.
    """
    print "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
    connection_values = get_connection_values_from_oauth_response(provider, oauth_response)
    print "provider:", provider
    print connection_values
    provider_id = connection_values.get('provider_id', None)
    full_name = connection_values['full_name']
    uid = connection_values['provider_user_id']
    email = connection_values.get('provider_email', None)
    if provider_id == 'facebook':
        if not email:
            email = "fb_%s_%s@unknown.com" % (uid, full_name.replace(' ', '_'))
    elif provider_id == 'twitter':
        if not email:
            uname = connection_values['display_name'].replace(' ','_')
            uname = uname.replace('@','')
            email = "tw_%s_%s@unknown.com" % (uid, uname)
    elif provider_id == 'google':
        if not email:
            email = "g_%s_%s@unknown.com" % (uid, full_name.replace(' ', '_'))
    else:
        print "***** Unknown provider id"
    print "**** Getting user"
    user = findOrAddUser(email, full_name)
    #db.session.commit()
    connection_values['user_id'] = user.id
    # Todo: add connection object to remember this
    # provider info for this user...
    #connect_handler(connection_values, provider)
    login_user(user)
    #db.session.commit()
    """
    ds = current_app.security.datastore
    user = ds.create_user( ... ) #fill in relevant stuff here
    ds.commit()
    connection_values['user_id'] = user.id
    connect_handler(connection_values, provider)
    login_user(user)
    db.commit()
    """
    return render_template("worldviews.html")



@app.route('/profile')
@login_required
def profile():
    notreqs = NOTIFIER.getNotificationRequests()
    print "notreqs:", notreqs
    return render_template(
        'profile.html',
        content='Profile Page',
        twitter_conn=social.twitter.get_connection(),
        facebook_conn=social.facebook.get_connection(),
        notreqs = notreqs,
        #foursquare_conn=social.foursquare.get_connection()
    )

@app.route('/notifications/clear')
@login_required
def notificationsClear():
    email = current_user.email
    print "notificationsClear", email
    #NOTIFIER.deleteRequests()
    NOTIFIER.deleteRequests({'email': email})
    return redirect('/profile')

@app.route('/notifications/add')
@login_required
def notificationsAdd():
    email = current_user.email
    print "notificationsAdd", email
    NOTIFIER.deleteRequests({'email': email})
    NOTIFIER.addRequest(
        {'email': email,
         'pattern': {'eventType': 'newChatPost'},
         'method': 'email'})
    NOTIFIER.addRequest(
        {'email': email,
         'pattern': {'eventType': 'newComment'},
         'method': 'email'})
    return redirect('/profile')


@app.route('/log')
@login_required
def log_on():
    print "log_on"
    return redirect('/')
#    render_template('TV.html')

