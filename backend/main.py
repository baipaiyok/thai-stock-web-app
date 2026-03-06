import yfinance as yf
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
import os
import pytz
import google.generativeai as genai
from settrade_v2 import Investor # สำคัญ: ต้องมีใน requirements.txt

# --- 1. ตั้งค่า Gemini AI ---
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def initialize_gemini():
    """ระบบเลือก Model ที่ใช้งานได้จริง"""
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        priority = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-pro']
        for target in priority:
            if any(target in name for name in available_models):
                m = genai.GenerativeModel(target)
                m.generate_content("test", generation_config={"max_output_tokens": 1})
                return m
    except: pass
    return None

model = initialize_gemini()

# --- 2. ตั้งค่า Settrade Sandbox (baipaiyo-E) ---
try:
    app_id = os.environ.get("SETTRADE_APP_ID")
    app_secret = os.environ.get("SETTRADE_APP_SECRET")
    account_no = os.environ.get("SETTRADE_ACCOUNT_NO")

    # ตรวจสอบว่าดึงค่าจาก Environment ได้จริงไหม
    if not all([app_id, app_secret, account_no]):
        print("❌ Missing Environment Variables!")
    
    investor = Investor(
        app_id=app_id,
        app_secret=app_secret,
        is_sandbox=True
    )
    equity = investor.Equity(account_no=account_no)
    
    # ทดสอบดึงสถานะทันทีเพื่อเช็คว่า Key ถูกต้องไหม
    test_status = equity.get_account_status()
    print(f"✅ Settrade Connected Successfully: {account_no}")

except Exception as e:
    # พิมพ์ Error แบบเต็มๆ ออกมาดูใน Log ของ Render
    print(f"❌ Settrade Connection Failed: {str(e)}")
    equity = None

# --- 3. FastAPI Setup ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

stock_cache = {}
tz_thai = pytz.timezone('Asia/Bangkok')

def get_dynamic_cache_time():
    now = datetime.now(tz_thai)
    current_time = now.strftime("%H:%M")
    if now.weekday() > 4: return 3600
    is_market_open = ("09:30" <= current_time <= "13:00") or ("14:00" <= current_time <= "17:00")
    return 30 if is_market_open else 3600

# --- 4. API Endpoints ---

@app.get("/api/stocks")
async def get_all_stocks(symbols: str = "PTT,CPALL,AOT,KBANK,DELTA"):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = []
    current_time = time.time()
    cache_expire = get_dynamic_cache_time()

    for sym in symbol_list:
        if sym in stock_cache and (current_time - stock_cache[sym]["last_fetch"] < cache_expire):
            results.append(stock_cache[sym]["data"])
            continue
        try:
            ticker = yf.Ticker(f"{sym}.BK")
            info = ticker.fast_info
            price = round(info.last_price, 2)
            prev_close = info.previous_close
            change = round(price - prev_close, 2)
            pct = round((change / prev_close) * 100, 2)
            data = {
                "symbol": sym, "price": price,
                "change": f"{'+' if change > 0 else ''}{change}",
                "pct": f"{'+' if pct > 0 else ''}{pct}%",
                "timestamp": datetime.now(tz_thai).strftime("%H:%M:%S")
            }
            stock_cache[sym] = {"data": data, "last_fetch": current_time}
            results.append(data)
        except: pass
    return results

@app.get("/api/portfolio")
async def get_portfolio():
    """เช็คพอร์ต baipaiyo-E ว่ามีหุ้นอะไรบ้าง"""
    if not equity: return {"status": "error", "message": "Settrade connection error"}
    try:
        return {"status": "success", "data": equity.get_portfolio()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/trade")
async def place_order(symbol: str = Body(...), side: str = Body(...), volume: int = Body(...)):
    """ส่งคำสั่งซื้อขายจริงไป Sandbox (PIN 000000)"""
    if not equity: return {"status": "error", "message": "Settrade connection error"}
    try:
        # ส่งคำสั่งราคาตลาด (Market Price) เพื่อให้ Match ทันที
        res = equity.place_order(
            symbol=f"{symbol.upper()}.BK",
            side=side.upper(),
            volume=volume,
            price=0, # 0 = Market Price
            pin="000000"
        )
        return {"status": "success", "data": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@app.get("/api/account-summary")
async def get_account_summary():
    if not equity: return {"status": "error", "message": "Settrade not connected"}
    try:
        # ดึงข้อมูลภาพรวมบัญชี (ชื่อบัญชี, เงินสด, วงเงิน)
        summary = equity.get_account_status()
        return {"status": "success", "data": summary}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/ai-analyze")
async def analyze_market(data: list = Body(...)):
    if not model: return {"analysis": "AI Model not ready"}
    try:
        stock_summary = "\n".join([f"- {s['symbol']}: {s['price']} ({s['pct']})" for s in data])
        prompt = f"คุณคือผู้เชี่ยวชาญหุ้นไทย วิเคราะห์หุ้นเหล่านี้: \n{stock_summary}\nแนะนำแนวทาง ซื้อ/ถือ/ขาย รายตัว"
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        return {"analysis": f"AI Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))