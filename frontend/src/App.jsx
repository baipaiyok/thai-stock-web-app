import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

// แก้ไขฟังก์ชันดึงข้อมูลให้ส่ง List ไปด้วย
const fetchData = async () => {
  try {
    const res = await axios.get(`https://thai-stock-web-app.onrender.com/api/stocks?symbols=${symbolList.join(',')}`);
    setStocks(res.data);
    setLoading(false);
  } catch (err) {
    console.error("Connection Error", err);
  }
};
  // เพิ่ม State สำหรับจัดการรายชื่อหุ้น
  const [symbolList, setSymbolList] = useState(() => {
  // ดึงค่าจาก LocalStorage ถ้าไม่มีให้ใช้ Default
    const saved = localStorage.getItem('myStocks');
    return saved ? JSON.parse(saved) : ["PTT", "CPALL", "AOT", "KBANK", "DELTA"];
  });
  const [newSymbol, setNewSymbol] = useState("");

  useEffect(() => {
    fetchData();
    // บันทึกค่าลง LocalStorage ทุกครั้งที่ List เปลี่ยน
    localStorage.setItem('myStocks', JSON.stringify(symbolList));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const apiTimer = setInterval(fetchData, 30000); // รีเฟรชข้อมูลทุก 30 วินาที
    return () => {
      clearInterval(timer);
      clearInterval(apiTimer);
    };
  }, [symbolList]);
  
  // ฟังก์ชันเพิ่มหุ้น
    const addStock = () => {
      if (newSymbol && !symbolList.includes(newSymbol.toUpperCase())) {
        setSymbolList([...symbolList, newSymbol.toUpperCase()]);
        setNewSymbol("");
      }
    };

    // ฟังก์ชันลบหุ้น
    const removeStock = (sym) => {
      setSymbolList(symbolList.filter(s => s !== sym));
    };

  const getMarketStatus = () => {
    const now = currentTime;
    const day = now.getDay(); 
    const timeStr = now.getHours() * 100 + now.getMinutes();

    if (day === 0 || day === 6) return { label: "MARKET CLOSED", color: "#ef4444" };

    const isOpen = (timeStr >= 1000 && timeStr <= 1230) || (timeStr >= 1430 && timeStr <= 1630);
    
    if (isOpen) return { label: "MARKET OPEN", color: "#22c55e" };
    return { label: "MARKET CLOSED", color: "#ef4444" };
  };

  const status = getMarketStatus();

  const getStatusColor = (decision) => {
    if (decision.includes("BUY")) return "#4ade80";
    if (decision.includes("SELL")) return "#f87171";
    return "#facc15";
  };

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      justifyContent: 'center', alignItems: 'center', 
      backgroundColor: '#0f172a', color: 'white',
      zIndex: 9999
    }}>
      <RefreshCw size={48} style={{ animation: 'spin 2s linear infinite' }} />
      <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: '500' }}>กำลังดึงข้อมูลหุ้นไทย...</p>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>(Server กำลังตื่น โปรดรอสักครู่...)</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: '#0f172a', 
      color: 'white', 
      padding: '20px',
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box',
      overflowX: 'hidden' // ป้องกันแถบขาวด้านขวา
    }}>
      
      {/* Container หลักเพื่อควบคุมความกว้าง */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
        
        {/* Header Section: รวม Title และ Market Status เข้าด้วยกัน */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '50px',
          flexWrap: 'wrap', // ป้องกันหลุดขอบในมือถือ
          gap: '20px',
          paddingTop: '20px'
        }}>
          {/* ซ้าย: ชื่อโปรเจกต์ */}
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>SET AI MONITOR</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginTop: '5px' }}>
              <Activity size={20} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>REAL-TIME AGENT DECISION</span>
            </div>
          </div>

          {/* ขวา: Market Status */}
          <div style={{
            textAlign: 'right',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            padding: '12px 20px',
            borderRadius: '16px',
            border: `1px solid ${status.color}`,
            minWidth: '220px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              {currentTime.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.3rem', margin: '2px 0' }}>
              {currentTime.toLocaleTimeString('th-TH')}
            </div>
            <div style={{ color: status.color, fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: status.color, borderRadius: '50%', display: 'inline-block', boxShadow: `0 0 10px ${status.color}` }}></span>
              {status.label}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '5px' }}>SET: 10:00-12:30 | 14:30-16:30</div>
          </div>
        </div>
        {/* Control Panel */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '30px', 
            justifyContent: 'center',
            flexWrap: 'wrap' 
          }}>
            <input 
              type="text" 
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="เพิ่มชื่อหุ้น เช่น OR, ADVANC"
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: 'white',
                outline: 'none'
              }}
            />
            <button 
              onClick={addStock}
              style={{
                padding: '12px 25px',
                borderRadius: '12px',
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              เพิ่มหุ้น
            </button>
          </div>

        {/* Stock Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '25px',
          width: '100%'
        }}>
          {stocks.map((stock) => (
            <div key={stock.symbol} style={{ 
              backgroundColor: '#1e293b', 
              borderRadius: '28px', 
              padding: '28px', 
              border: '1px solid #334155',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' }}>{stock.symbol}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '10px' }}>{stock.timestamp}</span>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '3.2rem', fontWeight: '800', letterSpacing: '-1px' }}>฿{stock.price}</div>
                <div style={{ 
                  color: stock.pct_val >= 0 ? '#4ade80' : '#f87171',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', fontWeight: '700'
                }}>
                  {stock.pct_val >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {stock.change} ({stock.pct})
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#0f172a', 
                borderRadius: '20px', 
                padding: '18px', 
                borderLeft: `6px solid ${getStatusColor(stock.decision)}`,
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AI DECISION</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: getStatusColor(stock.decision) }}>
                  {stock.decision}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '60px', color: '#475569', fontSize: '0.85rem' }}>
          *Data source: Yahoo Finance. Prices are real-time or delayed by up to 15 min.
        </p>
      </div>
    </div>
  );
}

export default App;