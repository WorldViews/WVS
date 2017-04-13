import flask_worldviews
import os
port = os.environ.get('FLASK_PORT')
if port:
    flask_worldviews.run(port=int(port))
else:
    flask_worldviews.run()
    
