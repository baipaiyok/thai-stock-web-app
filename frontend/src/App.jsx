import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Plus, X, BrainCircuit } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newSymbol, setNewSymbol] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [symbolList, setSymbolList] = useState(() => {
    const saved = localStorage.getItem('myStocks');
    return saved ? JSON.parse(saved) : ["PTT", "CPALL", "AOT", "KBANK", "DELTA"];
  });

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

  const runAI = async () => {
    if (stocks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`https://thai-stock-web-app.onrender.com/api/ai-analyze`, stocks);
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      alert("AI Analysis failed. Please check your Backend/Gemini API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addStock = async () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    if (symbolList.includes(sym)) {
      alert("หุ้นตัวนี้มีอยู่ในรายการแล้วครับ");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`https://thai-stock-web-app.onrender.com/api/stocks?symbols=${sym}`);
      if (res.data && res.data.length > 0 && res.data[0].price !== "N/A") {
        const newList = [...symbolList, sym];
        setSymbolList(newList);
        localStorage.setItem('myStocks', JSON.stringify(newList));
        setNewSymbol("");
      } else {
        alert(`ไม่พบข้อมูลหุ้นชื่อ "${sym}" กรุณาตรวจสอบชื่อย่อหุ้นอีกครั้ง`);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการค้นหาข้อมูลหุ้น");
    } finally {
      setLoading(false);
    }
  };

  const removeStock = (symToRemove) => {
    const isConfirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหุ้น ${symToRemove}?`);
    if (isConfirmed) {
      const newList = symbolList.filter(s => s !== symToRemove);
      setSymbolList(newList);
      localStorage.setItem('myStocks', JSON.stringify(newList));
    }
  };

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
      <p style={{ marginTop: '20px', fontWeight: 'bold' }}>กำลังอัปเดตข้อมูลพอร์ต...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Layout Wrapper */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        gap: '30px', 
        flexDirection: window.innerWidth < 1024 ? 'column' : 'row' // ปรับตามขนาดจอ
      }}>
        
        {/* --- ฝั่งซ้าย: Main Content (70%) --- */}
        <div style={{ flex: '1' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>SET AI MONITOR</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginTop: '5px' }}>
                <Activity size={20} />
                <span style={{ fontWeight: '600' }}>REAL-TIME AGENT DECISION</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '15px', borderRadius: '16px', border: `1px solid ${status.color}`, backdropFilter: 'blur(10px)' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{currentTime.toLocaleDateString('th-TH')}</div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{currentTime.toLocaleTimeString('th-TH')}</div>
              <div style={{ color: status.color, fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>● {status.label}</div>
            </div>
          </div>

          {/* Search/Add Input */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
            <input 
              type="text" 
              placeholder="เพิ่มชื่อหุ้น (เช่น OR, CPALL)" 
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
              style={{ flex: 1, padding: '15px 20px', borderRadius: '14px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', outline: 'none', fontSize: '1rem' }}
            />
            <button onClick={addStock} style={{ padding: '0 25px', borderRadius: '14px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <Plus size={20} /> เพิ่มหุ้น
            </button>
          </div>

          {/* Stock Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {stocks.map((stock) => (
              <div key={stock.symbol} style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '25px', border: '1px solid #334155', position: 'relative', transition: 'transform 0.2s' }}>
                <button 
                  onClick={() => removeStock(stock.symbol)}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '5px' }}
                >
                  <X size={20} />
                </button>
                <div style={{ marginBottom: '15px' }}><span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#94a3b8' }}>{stock.symbol}</span></div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: '800' }}>฿{stock.price}</div>
                  <div style={{ color: stock.pct_val >= 0 ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}>
                    {stock.pct_val >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    {stock.change} ({stock.pct})
                  </div>
                </div>
                <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '15px', borderLeft: `6px solid ${getStatusColor(stock.decision)}` }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '5px', fontWeight: 'bold' }}>AI DECISION</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: getStatusColor(stock.decision) }}>{stock.decision}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ฝั่งขวา: AI Agent Sidebar (30%) --- */}
        <div style={{ 
          width: window.innerWidth < 1024 ? '100%' : '380px', 
          backgroundColor: '#1e293b', 
          borderRadius: '28px', 
          padding: '30px', 
          border: '2px solid #38bdf8',
          height: 'fit-content',
          position: 'sticky',
          top: '40px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <BrainCircuit size={32} color="#38bdf8" />
            <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>AI Insights</h3>
          </div>
          
          <button 
            onClick={runAI}
            disabled={isAnalyzing || stocks.length === 0}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '16px',
              backgroundColor: isAnalyzing ? '#475569' : '#38bdf8',
              color: '#0f172a',
              fontWeight: '900',
              fontSize: '1rem',
              border: 'none',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              marginBottom: '25px',
              boxShadow: isAnalyzing ? 'none' : '0 4px 15px rgba(56, 189, 248, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {isAnalyzing ? "กำลังประมวลผล..." : "🪄 วิเคราะห์พอร์ตหุ้น"}
          </button>

          <div style={{ 
            color: '#e2e8f0', 
            fontSize: '0.95rem', 
            lineHeight: '1.8',
            backgroundColor: '#0f172a',
            padding: '20px',
            borderRadius: '16px',
            minHeight: '200px',
            border: '1px solid #334155',
            whiteSpace: 'pre-wrap'
          }}>
            {aiAnalysis ? (
              aiAnalysis
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>
                <p>ยังไม่มีข้อมูลวิเคราะห์</p>
                <p style={{ fontSize: '0.8rem' }}>คลิกปุ่มด้านบนเพื่อเริ่มการวิเคราะห์ด้วย AI Gemini 3.1</p>
              </div>
            )}
          </div>
          
          <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '20px', textAlign: 'center' }}>
            *การวิเคราะห์เป็นเพียงการคาดการณ์จาก AI ไม่ใช่คำแนะนำทางการเงิน
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;