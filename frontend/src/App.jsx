import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Plus, X } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newSymbol, setNewSymbol] = useState("");
  
  // 1. ดึงรายชื่อหุ้นจาก LocalStorage (ถ้าไม่มีใช้ Default)
  const [symbolList, setSymbolList] = useState(() => {
    const saved = localStorage.getItem('myStocks');
    return saved ? JSON.parse(saved) : ["PTT", "CPALL", "AOT", "KBANK", "DELTA"];
  });

  // 2. ฟังก์ชันดึงข้อมูล (ส่งรายชื่อหุ้นไปใน URL)
  const fetchData = useCallback(async () => {
    try {
      const symbolsParam = symbolList.join(',');
      const res = await axios.get(`https://thai-stock-web-app.onrender.com/api/stocks?symbols=${symbolsParam}`);
      setStocks(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Connection Error", err);
    }
  }, [symbolList]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // 3. ฟังก์ชันเพิ่ม/ลดหุ้น
  const addStock = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (sym && !symbolList.includes(sym)) {
      const newList = [...symbolList, sym];
      setSymbolList(newList);
      localStorage.setItem('myStocks', JSON.stringify(newList));
      setNewSymbol("");
      setLoading(true); // แสดง Loading แป๊บหนึ่งเพื่อโหลดข้อมูลตัวใหม่
    }
  };

  const removeStock = (symToRemove) => {
    const newList = symbolList.filter(s => s !== symToRemove);
    setSymbolList(newList);
    localStorage.setItem('myStocks', JSON.stringify(newList));
  };

  // --- Logic เดิม (getMarketStatus, getStatusColor) ก๊อปปี้จากของเก่ามาวางได้เลย ---
  const getMarketStatus = () => {
    const now = currentTime;
    const day = now.getDay(); 
    const timeStr = now.getHours() * 100 + now.getMinutes();
    if (day === 0 || day === 6) return { label: "MARKET CLOSED", color: "#ef4444" };
    const isOpen = (timeStr >= 1000 && timeStr <= 1230) || (timeStr >= 1430 && timeStr <= 1630);
    return isOpen ? { label: "MARKET OPEN", color: "#22c55e" } : { label: "MARKET CLOSED", color: "#ef4444" };
  };
  const status = getMarketStatus();
  const getStatusColor = (decision) => decision.includes("BUY") ? "#4ade80" : decision.includes("SELL") ? "#f87171" : "#facc15";

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white', zIndex: 9999 }}>
      <RefreshCw size={48} style={{ animation: 'spin 2s linear infinite' }} />
      <p style={{ marginTop: '20px' }}>กำลังดึงข้อมูลหุ้นที่คุณเลือก...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
  <div className="app-container">
    {/* Header & Market Status */}
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: '40px', 
      flexWrap: 'wrap', 
      gap: '20px' 
    }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>SET AI MONITOR</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8' }}>
          <Activity size={20} />
          <span>REAL-TIME AGENT DECISION</span>
        </div>
      </div>
      
      <div style={{ 
        textAlign: 'right', 
        backgroundColor: 'rgba(30, 41, 59, 0.7)', 
        padding: '10px 15px', 
        borderRadius: '12px', 
        border: `1px solid ${status.color}` 
      }}>
        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{currentTime.toLocaleDateString('th-TH')}</div>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{currentTime.toLocaleTimeString('th-TH')}</div>
        <div style={{ color: status.color, fontSize: '0.8rem', fontWeight: 'bold' }}>● {status.label}</div>
      </div>
    </header>

    {/* Input Section */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
      <input 
        type="text" 
        placeholder="ชื่อหุ้น เช่น PTT" 
        value={newSymbol}
        onChange={(e) => setNewSymbol(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addStock()}
        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', outline: 'none', width: '200px' }}
      />
      <button onClick={addStock} style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
        <Plus size={20} /> เพิ่มหุ้น
      </button>
    </div>

    {/* Stock Grid */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
      gap: '24px' 
    }}>
      {stocks.map(stock => (
        <div key={stock.symbol} style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '25px', border: '1px solid #334155', position: 'relative' }}>
          <button 
            onClick={() => removeStock(stock.symbol)}
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#94a3b8' }}>{stock.symbol}</span>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: '700' }}>฿{stock.price}</div>
            <div style={{ color: stock.pct_val >= 0 ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
              {stock.pct_val >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {stock.change} ({stock.pct})
            </div>
          </div>
          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '15px', borderLeft: `6px solid ${getStatusColor(stock.decision)}` }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '5px' }}>AI DECISION</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: getStatusColor(stock.decision) }}>{stock.decision}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}

export default App;