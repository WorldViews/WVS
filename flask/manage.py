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

manager = Manager(app)
manager.add_command("server", Server())
manager.add_command("show-urls", ShowUrls())
manager.add_command("clean", Clean())


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

if __name__ == "__main__":
    manager.run()