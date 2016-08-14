
This is now using flask_security, flask_admin and flask_social for authentication.

This required a modification to the function login_handler in views.py
of .../Lib/site-packages/flask_social/views.py
which is 

   user = connection.user

-->

   user = getUserById(connection.user_id)

