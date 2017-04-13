call venv\Scripts\activate

REM python flaskAuthServer80.py
set PORT=80
set HOST=0.0.0.0
set FLASK_PORT=7000
start /D..\react npm run dev
python flaskWVServer.py

