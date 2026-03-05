import yfinance as yf
from fastapi import FastAPI, Body # เพิ่ม Body เข้ามา
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
import os
import pytz
import google.generativeai as genai

# 1. โหลด API Key
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# 2. ปรับเป็นรุ่น Gemini 3 Flash ตามที่คุณต้องการ (เร็วและเสถียรที่สุด)
model = genai.GenerativeModel('gemini-1.5-flash') 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ปรับเป็น * ชั่วคราวเพื่อให้เทสได้ทุก URL ของ Vercel
    allow_methods=["*"],
    allow_headers=["*"],
)

stock_cache = {}
tz_thai = pytz.timezone('Asia/Bangkok')

def get_dynamic_cache_time():
    now = datetime.now(tz_thai)
    current_time = now.strftime("%H:%M")
    weekday = now.weekday()
    if weekday > 4: return 3600
    is_market_open = ("09:30" <= current_time <= "13:00") or ("14:00" <= current_time <= "17:00")
    return 30 if is_market_open else 3600

def get_ai_decision(change_pct):
    if change_pct > 2.0: return "STRONG BUY"
    if change_pct > 0.5: return "BUY"
    if change_pct < -2.0: return "STRONG SELL"
    if change_pct < -0.5: return "SELL"
    return "HOLD"

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
                "pct_val": pct, "decision": get_ai_decision(pct),
                "timestamp": datetime.now(tz_thai).strftime("%H:%M:%S"),
                "mode": "Active" if cache_expire == 30 else "Power Saving"
            }
            stock_cache[sym] = {"data": data, "last_fetch": current_time}
            results.append(data)
        except Exception as e:
            if sym in stock_cache: results.append(stock_cache[sym]["data"])
    return results

# แก้ไขฟังก์ชันวิเคราะห์ให้ใช้ Body(...) เพื่อความชัวร์ในการรับ List
@app.post("/api/ai-analyze")
async def analyze_market(data: list = Body(...)):
    try:
        # เตรียมข้อมูลหุ้นให้ AI
        stock_summary = "\n".join([f"- {s['symbol']}: ราคา {s['price']} ({s['pct']})" for s in data])
        
        prompt = f"""
        คุณคือ AI ผู้เชี่ยวชาญการวิเคราะห์หุ้นไทย (SET)
        วิเคราะห์รายการหุ้นในพอร์ตต่อไปนี้:
        {stock_summary}
        
        ภารกิจ:
        1. ระบุ 'Alpha Stock' (ตัวที่เด่นที่สุดในลิสต์) พร้อมเหตุผลสั้นๆ
        2. ประเมินความเสี่ยงพอร์ตโดยรวม
        3. แนะนำ Action Plan: ซื้อ, ถือ, หรือ ขาย รายตัว
        
        ตอบเป็นภาษาไทย ใช้ Markdown จัดหัวข้อให้สวยงามและอ่านง่าย
        """
        
        response = await model.generate_content_async(prompt)
        return {"analysis": response.text}
    except Exception as e:
        print(f"AI ERROR: {str(e)}") # ดู Error ใน Logs ของ Render
        return {"analysis": f"AI ไม่สามารถวิเคราะห์ได้ในขณะนี้ (Error: {str(e)})"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)