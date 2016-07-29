# WVS
WorldViews project code with TeleViewer and several server configurations
for using it.

Setup
-----

After copying or cloning, Cesium must be installed.
Copy or add symbolic link from the Cesium distribution
Build/Cesium directory to the TeleViewer/static/Cesium.  Then
choose and setup one or more server configurations.

Server Configurations
---------------------

Python
------

The simplest way to use TeleViewer is with a simple Python server.
With a typical python installation, it should work just to run
TeleViewer/PhysVizServer.py.

Nodejs
------

For this configuration, you just need to install nodejs and some
packages.  Go to the WVS/node directory and run "npm install".
Based on the pagkage.json file in that directory it should install
the necessary packages.

Then it can be run with a command like

  > node server.js --port 3000

there are bat files for a few configurations (different port
assignments.)

To run just the SocketIO server part of the system use

  > node socketIOServer.js -- port 3000

or launch it with runSocketServer.bat or a .sh script.

Flask
-----

For the flask server, go to the flask directory.  If you have
a python with the appropriate modules installed, you can just run
flaskAuthServer80.py or one of the other scripts with different
port assignments.

If you don't have the necessary modules, you can create a virtual
environment and use requirements to get the modules.  Do something
like:

   > pip install virtualenv
   > virtualenv venv
   > venv\scripts\activate
   (venv)> pip install -r requirements

and you should have an appropriate environment.

Django
------

For this configuration, you should go to the django directly and setup
the proper python environment for django if necessary.  The requirements.txt
can be used with virtualenv and pip to set that up, same as for flask as
described above.

Then you must run

  > python manage.py syncdb

to get the DB set up, and then

  > python manage.py runserver

to run the django server.

