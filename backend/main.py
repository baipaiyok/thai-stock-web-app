import yfinance as yf
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ระบบ Cache ป้องกันโดนแบน ---
# ระบบ Cache แยกรายตัว
stock_cache = {}
CACHE_EXPIRE = 30 # วินาที
def get_ai_decision(change_pct):
    """AI Agent Decision Logic"""
    if change_pct > 2.0: return "STRONG BUY"
    if change_pct > 0.5: return "BUY"
    if change_pct < -2.0: return "STRONG SELL"
    if change_pct < -0.5: return "SELL"
    return "HOLD"

@app.get("/api/stocks")
async def get_all_stocks():
    symbols = ["PTT", "CPALL", "AOT", "KBANK", "DELTA"]
    results = []
    current_time = time.time()

    for sym in symbols:
        # เช็ค Cache รายตัว
        if sym in stock_cache and (current_time - stock_cache[sym]["last_fetch"] < CACHE_EXPIRE):
            results.append(stock_cache[sym]["data"])
            continue

        try:
            ticker = yf.Ticker(f"{sym}.BK")
            info = ticker.fast_info
            price = round(info.last_price, 2)
            change = round(price - info.previous_close, 2)
            pct = round((change / info.previous_close) * 100, 2)

            data = {
                "symbol": sym,
                "price": price,
                "change": f"{'+' if change > 0 else ''}{change}",
                "pct": f"{'+' if pct > 0 else ''}{pct}%",
                "pct_val": pct,
                "decision": get_ai_decision(pct),
                "timestamp": datetime.now().strftime("%H:%M:%S")
            }
            # อัปเดต Cache
            stock_cache[sym] = {"data": data, "last_fetch": current_time}
            results.append(data)
        except:
            if sym in stock_cache: results.append(stock_cache[sym]["data"])

    return results

if __name__ == "__main__":
    import uvicorn
    # Render/Railway จะส่ง PORT มาให้ผ่าน Environment Variable
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)