#!/bin/bash

# เปิดหน้าต่างใหม่สำหรับ Backend
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/backend\" && source venv/bin/activate && uvicorn main:app --reload"'

# เปิดหน้าต่างใหม่สำหรับ Frontend
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/frontend\" && npm run dev"'