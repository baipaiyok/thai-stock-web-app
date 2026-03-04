@echo off
:: เปิด Backend ในหน้าต่างใหม่
start cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn main:app --reload"

:: เปิด Frontend ในหน้าต่างใหม่
start cmd /k "cd frontend && npm run dev"