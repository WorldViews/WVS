#!/usr/bin/env python

import os

# disalble ExtDeprecationWarning
import warnings
from flask.exthook import ExtDeprecationWarning
warnings.simplefilter('ignore', ExtDeprecationWarning)


from flask_script import Manager, Server
from flask_script.commands import ShowUrls, Clean
from flask_worldviews import app, db
from flask_worldviews.Accounts import User, Role
from flask_worldviews.models.tracks import Track, TrackPosition
import unittest
import subprocess
import time

hmr_server = None

class ReactFlaskServer(Server):
    """ Run React + Flask Server """
    def __call__(self, app, host, port, use_debugger, use_reloader,
               threaded, processes, passthrough_errors):
        # spawn hot reload server
        dir_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'react')
        environ = os.environ.copy()
        environ['PORT'] = str(port)

        port = 7000
        environ['FLASK_PORT'] = str(port)
        global hmr_server
        if hmr_server is None:
            hmr_server = subprocess.Popen(["npm", "run", "dev"], cwd=dir_path)
        
        # run the server
        super(self.__class__, self).__call__(app, host, port,
            use_debugger, use_reloader, threaded, processes, passthrough_errors)


manager = Manager(app)
manager.add_command("show-urls", ShowUrls())
manager.add_command("clean", Clean())
manager.add_command("runserver", ReactFlaskServer())

@manager.shell
def make_shell_context():
    """ Creates a python REPL with several default imports
        in the context of the app
    """
    return dict(app=app, db=db,
        User=User, Role=Role, Track=Track, TrackPosition=TrackPosition)

@manager.command
def test():
    """Run unit tests."""
    tests = unittest.TestLoader().discover('tests')
    result = unittest.TextTestRunner(verbosity=2).run(tests)
    if result.wasSuccessful():
        return 0
    else:
        return 1

@manager.command
def setup():
    """ run npm install and other setup for the project """
    dir_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'react')
    handle = subprocess.Popen(["npm", "install"], cwd=dir_path)
    handle.wait()

@manager.command
def runmongo():
    """ run npm install and other setup for the project """
    dir_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'mongo')
    print dir_path
    handle = subprocess.Popen(["mongod", "--dbpath=./mongo_db"], cwd=dir_path)
    handle.wait()


if __name__ == "__main__":
    manager.run()