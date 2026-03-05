import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Plus, X } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newSymbol, setNewSymbol] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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
  const runAI = async () => {
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`https://thai-stock-web-app.onrender.com/api/ai-analyze`, stocks);
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      alert("AI Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };
  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // 3. ฟังก์ชันเพิ่ม/ลดหุ้น
  const addStock = async () => {
    const sym = newSymbol.trim().toUpperCase();
    
    if (!sym) return;

    // 1. เช็คว่ามีในลิสต์เดิมอยู่แล้วหรือไม่
    if (symbolList.includes(sym)) {
      alert("หุ้นตัวนี้มีอยู่ในรายการแล้วครับ");
      return;
    }

    setLoading(true); // เริ่มโหลดเพื่อเช็คข้อมูล
    try {
      // ลองดึงข้อมูลเฉพาะหุ้นตัวที่จะเพิ่ม
      const res = await axios.get(`https://thai-stock-web-app.onrender.com/api/stocks?symbols=${sym}`);
      
      // 2. เช็คว่า API คืนค่าข้อมูลหุ้นตัวนั้นมาหรือไม่ (เช็คราคาหรือชื่อ)
      if (res.data && res.data.length > 0 && res.data[0].price !== "N/A") {
        const newList = [...symbolList, sym];
        setSymbolList(newList);
        localStorage.setItem('myStocks', JSON.stringify(newList));
        setNewSymbol("");
      } else {
        // 3. ถ้าไม่เจอข้อมูล ให้แจ้งเตือน
        alert(`ไม่พบข้อมูลหุ้นชื่อ "${sym}" กรุณาตรวจสอบชื่อย่อหุ้นอีกครั้ง (เช่น PTT, CPALL)`);
      }
    } catch (err) {
      console.error("Search Error", err);
      alert("เกิดข้อผิดพลาดในการค้นหาข้อมูลหุ้น");
    } finally {
      setLoading(false);
    }
  };
  const removeStock = (symToRemove) => {
    // สร้าง Pop-up ถามยืนยัน
    const isConfirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหุ้น ${symToRemove} ออกจากรายการ?`);
    
    if (isConfirmed) {
      const newList = symbolList.filter(s => s !== symToRemove);
      setSymbolList(newList);
      localStorage.setItem('myStocks', JSON.stringify(newList));
    }
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
    <div className="app-container" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* ฝั่งซ้าย: รายการหุ้น (70%) */}
      <div style={{ flex: '1', minWidth: '600px' }}>
        {/* ... ส่วน Title, Input และ Stock Grid เดิมของคุณ ... */}
      </div>

      {/* ฝั่งขวา: AI Agent Sidebar (30%) */}
      <div style={{ 
        width: '350px', 
        backgroundColor: '#1e293b', 
        borderRadius: '24px', 
        padding: '25px', 
        border: '1px solid #38bdf8',
        height: 'fit-content',
        position: 'sticky',
        top: '40px'
      }}>
        <h3 style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
          <Activity size={24} /> AI Market Insights
        </h3>
        
        <button 
          onClick={runAI}
          disabled={isAnalyzing || stocks.length === 0}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            backgroundColor: isAnalyzing ? '#475569' : '#38bdf8',
            color: '#0f172a',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          {isAnalyzing ? "AI กำลังอ่านกราฟ..." : "🪄 วิเคราะห์ทั้งพอร์ต"}
        </button>

        <div style={{ 
          color: '#cbd5e1', 
          fontSize: '0.9rem', 
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap' // เพื่อให้แสดง Markdown/บรรทัดใหม่ได้สวยงาม
        }}>
          {aiAnalysis ? (
            aiAnalysis
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b' }}>กดปุ่มด้านบนเพื่อให้ AI เริ่มวิเคราะห์หุ้นในลิสต์ของคุณ</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;