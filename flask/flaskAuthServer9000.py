#!/usr/bin/env python
# disalble ExtDeprecationWarning
import warnings
from flask.exthook import ExtDeprecationWarning
warnings.simplefilter('ignore', ExtDeprecationWarning)

import flask_worldviews
flask_worldviews.run(port=9000)

