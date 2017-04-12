call venv\Scripts\activate

REM python flaskAuthServer80.py
set PORT=80
start npm run dev
python flaskWVServer.py

