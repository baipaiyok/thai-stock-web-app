import yfinance as yf
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
import os
import pytz # แนะนำให้ลงเพิ่ม: pip install pytz เพื่อล็อคเวลาไทย
import os
import google.generativeai as genai

# 1. โหลด API Key (ควรตั้งไว้ใน Environment ของ Render)
api_key = os.environ.get("GEMINI_API_KEY")

# 2. ตั้งค่าการเชื่อมต่อกับ Google
genai.configure(api_key=api_key)

# 3. สร้างตัวแปร model (นี่คือที่มาของมันครับ!)
# เราเลือกใช้รุ่น gemini-2.0-flash เพราะเร็วและราคาประหยัดที่สุด
model = genai.GenerativeModel('gemini-3.1-pro-preview')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # สำหรับเทสในเครื่อง
        "https://thai-stock-web-app.vercel.app",  # ใส่ URL ของหน้าเว็บ Vercel ของคุณ
        "https://thai-stock-web-cky24cnff-baipaiyoks-projects.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ระบบ Cache ป้องกันโดนแบน ---
# ระบบ Cache แยกรายตัว
stock_cache = {}
# สร้าง Timezone ของไทยเพื่อให้เวลาบน Server (Render) ตรงกับบ้านเรา
tz_thai = pytz.timezone('Asia/Bangkok')
def get_dynamic_cache_time():
    """คำนวณระยะเวลา Cache ตามเวลาตลาดหุ้นไทย"""
    now = datetime.now(tz_thai)
    current_time = now.strftime("%H:%M")
    weekday = now.weekday() # 0-4 คือ จันทร์-ศุกร์

    # ถ้าเป็นวันเสาร์-อาทิตย์ ให้เช็คทุก 1 ชั่วโมง (3600 วินาที)
    if weekday > 4:
        return 3600

    # ช่วงเวลาเปิดตลาด (รวมก่อน/หลัง 30 นาที)
    # เช้า: 09:30 - 13:00 | บ่าย: 14:00 - 17:00
    is_market_open = (
        ("09:30" <= current_time <= "13:00") or 
        ("14:00" <= current_time <= "17:00")
    )

    if is_market_open:
        return 30 # ดึงบ่อยปกติทุก 30 วินาที
    else:
        return 3600 # นอกเวลาตลาด เช็คทุก 1 ชั่วโมง

def get_ai_decision(change_pct):
    if change_pct > 2.0: return "STRONG BUY"
    if change_pct > 0.5: return "BUY"
    if change_pct < -2.0: return "STRONG SELL"
    if change_pct < -0.5: return "SELL"
    return "HOLD"

@app.get("/api/stocks")
async def get_all_stocks(symbols: str = "PTT,CPALL,AOT,KBANK,DELTA"):
    # รับค่า symbols จาก URL เช่น /api/stocks?symbols=PTT,OR
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    
    results = []
    current_time = time.time()
    cache_expire = get_dynamic_cache_time()

    for sym in symbol_list:
        # เช็ค Cache รายตัว โดยใช้ค่า expire ที่คำนวณมา
        if sym in stock_cache and (current_time - stock_cache[sym]["last_fetch"] < cache_expire):
            results.append(stock_cache[sym]["data"])
            continue

        try:
            ticker = yf.Ticker(f"{sym}.BK")
            # ใช้ fast_info เพื่อความเร็ว
            info = ticker.fast_info
            price = round(info.last_price, 2)
            prev_close = info.previous_close
            change = round(price - prev_close, 2)
            pct = round((change / prev_close) * 100, 2)

            data = {
                "symbol": sym,
                "price": price,
                "change": f"{'+' if change > 0 else ''}{change}",
                "pct": f"{'+' if pct > 0 else ''}{pct}%",
                "pct_val": pct,
                "decision": get_ai_decision(pct),
                "timestamp": datetime.now(tz_thai).strftime("%H:%M:%S"),
                "mode": "Active" if cache_expire == 30 else "Power Saving" # บอกสถานะว่าตอนนี้เช็คบ่อยแค่ไหน
            }
            
            stock_cache[sym] = {"data": data, "last_fetch": current_time}
            results.append(data)
        except Exception as e:
            print(f"Error fetching {sym}: {e}")
            if sym in stock_cache: results.append(stock_cache[sym]["data"])

    return results

# backend/main.py เพิ่มส่วนนี้เข้าไป
@app.post("/api/ai-analyze")
async def analyze_market(data: list):
    stock_summary = "\n".join([f"{s['symbol']}: {s['price']} ({s['pct']})" for s in data])
    
    # ปรับ Prompt ให้ดึงพลัง Agent ของ 3.1 ออกมา
    prompt = f"""
    วิเคราะห์พอร์ตหุ้นไทยแบบ Agentic Analysis:
    {stock_summary}
    
    ภารกิจ:
    1. ระบุ 'Alpha Stock' (ตัวที่เด่นที่สุด) พร้อมเหตุผลเชิงเทคนิค
    2. ประเมินความเสี่ยงพอร์ตโดยรวม (Risk Assessment)
    3. แนะนำ Action Plan: Buy, Hold, หรือ Liquidate รายตัว
    
    ตอบเป็น Markdown ภาษาไทยที่อ่านง่ายและดูเป็นมืออาชีพ
    """
    
    response = await model.generate_content_async(prompt)
    return {"analysis": response.text}
    

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)