import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

const fetchData = async () => {
    try {
      const res = await axios.get(`https://thai-stock-web-app.onrender.com/api/stocks`);
      setStocks(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Connection Error", err);
    }
};

useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // อัปเดตทุก 10 วินาที
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (decision) => {
    if (decision.includes("BUY")) return "#4ade80"; // เขียว
    if (decision.includes("SELL")) return "#f87171"; // แดง
    return "#facc15"; // เหลือง (HOLD)
};
if (loading) return (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    height: '100vh', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    color: 'white' 
  }}>
    {/* เพิ่ม className เพื่อให้หมุน (ถ้าใช้ Tailwind) หรือใส่สไตล์หมุนเอง */}
    <RefreshCw size={48} style={{ animation: 'spin 2s linear infinite' }} />
    <p style={{ marginTop: '20px' }}>กำลังดึงข้อมูลหุ้นไทย...</p>
    
    {/* CSS สำหรับทำให้ไอคอนหมุน */}
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: 'white', 
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>SET AI MONITOR</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: '#38bdf8' }}>
          <Activity size={20} />
          <span>REAL-TIME AGENT DECISION</span>
        </div>
      </div>

      {/* Responsive Grid Container */}
      <div style={{ 
        display: 'grid', 
        // ปรับ minmax ให้เล็กลงหน่อยเพื่อให้จุหุ้นได้หลายตัวในแถวเดียวบนจอใหญ่
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        width: '100%',       // ใช้ความกว้างเต็ม 100%
        maxWidth: '95vw',    // หรือใส่เป็น 95vw เพื่อให้เหลือขอบข้างนิดหน่อยพอสวยงาม
        margin: '0 auto', 
        alignItems: 'center'  
      }}>
        {stocks.map((stock) => (
          <div key={stock.symbol} style={{ 
            backgroundColor: '#1e293b', 
            borderRadius: '24px', 
            padding: '25px', 
            border: '1px solid #334155',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#94a3b8' }}>{stock.symbol}</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{stock.timestamp}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '2.8rem', fontWeight: '700' }}>฿{stock.price}</div>
              <div style={{ 
                color: stock.pct_val >= 0 ? '#4ade80' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '600'
              }}>
                {stock.pct_val >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {stock.change} ({stock.pct})
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#0f172a', 
              borderRadius: '16px', 
              padding: '15px', 
              borderLeft: `6px solid ${getStatusColor(stock.decision)}` 
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '5px' }}>AI DECISION</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: getStatusColor(stock.decision) }}>
                {stock.decision}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '40px', color: '#475569', fontSize: '0.8rem' }}>
        *Data delayed by 1-15 minutes (Yahoo Finance Source)
      </p>
    </div>
  );
}

export default App;