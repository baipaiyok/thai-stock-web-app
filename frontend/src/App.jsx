import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const getMarketStatus = () => {
  const now = currentTime;
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const timeStr = now.getHours() * 100 + now.getMinutes(); // เช่น 10:30 -> 1030

  // เช็คว่าเป็นวันหยุดเสาร์-อาทิตย์ไหม
  if (day === 0 || day === 6) return { label: "MARKET CLOSED", color: "#ef4444" };

  // ช่วงเช้า: 10:00 - 12:30 | ช่วงบ่าย: 14:30 - 16:30
  const isOpen = (timeStr >= 1000 && timeStr <= 1230) || (timeStr >= 1430 && timeStr <= 1630);
  
  if (isOpen) return { label: "MARKET OPEN", color: "#22c55e" };
  return { label: "MARKET CLOSED", color: "#ef4444" };
};

const status = getMarketStatus();

  const getStatusColor = (decision) => {
    if (decision.includes("BUY")) return "#4ade80"; // เขียว
    if (decision.includes("SELL")) return "#f87171"; // แดง
    return "#facc15"; // เหลือง (HOLD)
};
if (loading) return (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    position: 'fixed', // ใช้ fixed เพื่อให้อยู่บนสุดและอ้างอิงกับหน้าจอ (Viewport)
    top: 0,
    left: 0,
    width: '100vw',    // เต็มความกว้างหน้าจอ
    height: '100vh',   // เต็มความสูงหน้าจอ
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    color: 'white',
    zIndex: 9999       // มั่นใจว่าอยู่หน้าสุด ไม่โดนอะไรทับ
  }}>
    {/* เพิ่ม className เพื่อให้หมุน (ถ้าใช้ Tailwind) หรือใส่สไตล์หมุนเอง */}
   <RefreshCw size={48} style={{ animation: 'spin 2s linear infinite' }} />
    <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: '500' }}>
       กำลังดึงข้อมูลหุ้นไทย...
    </p>
    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>
       (Server กำลังตื่นจากการหลับพักผ่อน โปรดรอสักครู่...)
    </p>
    
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
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        textAlign: 'right',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        padding: '10px 15px',
        borderRadius: '8px',
        border: `1px solid ${status.color}`,
        fontSize: '0.9rem'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>
          {currentTime.toLocaleDateString('th-TH', { 
            year: 'numeric', month: 'short', day: 'numeric' 
          })}
        </div>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {currentTime.toLocaleTimeString('th-TH')}
        </div>
        <div style={{ 
          color: status.color, 
          fontSize: '0.75rem', 
          fontWeight: 'bold', 
          marginTop: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '5px'
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            backgroundColor: status.color, 
            borderRadius: '50%',
            display: 'inline-block',
            boxShadow: `0 0 10px ${status.color}`
          }}></span>
          {status.label}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '4px' }}>
          SET: 10:00-12:30 | 14:30-16:30
        </div>
      </div>
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