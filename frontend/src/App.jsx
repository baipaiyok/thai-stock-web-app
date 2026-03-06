import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Plus, X, BrainCircuit, ShoppingCart, Briefcase, Wallet } from 'lucide-react';

const API_BASE = "https://thai-stock-web-app.onrender.com/api"; // ปรับให้ตรงกับ Render ของคุณ

function App() {
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]); // เก็บข้อมูลจาก baipaiyo-E
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newSymbol, setNewSymbol] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // เพิ่ม State สำหรับเก็บข้อมูลบัญชี
  const [accountInfo, setAccountInfo] = useState({ account_no: 'Loading...', line_available: 0 });
  
  // Trade Modal State
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeData, setTradeData] = useState({ symbol: '', side: 'BUY', volume: 100 });

  const [symbolList, setSymbolList] = useState(() => {
    const saved = localStorage.getItem('myStocks');
    return saved ? JSON.parse(saved) : ["PTT", "CPALL", "AOT", "KBANK", "DELTA"];
  });

  // 1. ดึงข้อมูลราคาหุ้น (Watchlist)
  const fetchData = useCallback(async () => {
    try {
      const symbolsParam = symbolList.join(',');
      const res = await axios.get(`${API_BASE}/stocks?symbols=${symbolsParam}`);
      setStocks(res.data);
    } catch (err) { console.error("Price Update Error", err); }
  }, [symbolList]);

  // 2. ดึงข้อมูลพอร์ตจริงจาก Settrade baipaiyo-E
  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/portfolio`);
      if (res.data.status === "success") {
        setPortfolio(res.data.data);
      }
    } catch (err) { console.error("Portfolio Fetch Error", err); }
  }, []);

  // ฟังก์ชันดึงข้อมูลบัญชีแบบ Dynamic
  const fetchAccount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/account-summary`);
      if (res.data.status === "success") {
        // ดึงค่า line_available (เงินที่ซื้อได้) และ account_no มาโชว์
        setAccountInfo(res.data.data[0]); 
      }
    } catch (err) { console.error("Account Fetch Error", err); }
  }, []);

  // เพิ่มเข้าไปใน useEffect
  useEffect(() => {
    fetchData();
    fetchPortfolio();
    fetchAccount(); // ดึงข้อมูลบัญชีครั้งแรก
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตเวลาทุกวินาที
    return () => clearInterval(timer);
  }, [fetchData, fetchPortfolio, fetchAccount]);
  // ฟังก์ชันเช็คสถานะตลาด (แบบละเอียด)
  const getMarketStatus = () => {
    const now = currentTime;
    const day = now.getDay(); 
    const timeStr = now.getHours() * 100 + now.getMinutes();
    
    if (day === 0 || day === 6) return { label: "MARKET CLOSED (Holiday)", color: "#ef4444" };
    
    const isMorning = timeStr >= 1000 && timeStr <= 1230;
    const isAfternoon = timeStr >= 1430 && timeStr <= 1630;
    
    if (isMorning || isAfternoon) return { label: "MARKET OPEN", color: "#22c55e" };
    return { label: "MARKET CLOSED (Break)", color: "#facc15" };
  };
  const marketStatus = getMarketStatus();
  // 3. ฟังก์ชันส่งคำสั่งเทรดไป Sandbox
  const handleTrade = async () => {
    try {
      const res = await axios.post(`${API_BASE}/trade`, tradeData);
      if (res.data.status === "success") {
        alert(`✅ ส่งคำสั่ง ${tradeData.side} ${tradeData.symbol} สำเร็จ!`);
        setShowTradeModal(false);
        setTimeout(fetchPortfolio, 2000); // รอระบบ Match แล้วดึงพอร์ตใหม่
      } else {
        alert(`❌ ล้มเหลว: ${res.data.message}`);
      }
    } catch (err) {
      alert("Trade Error: ติดต่อ Server ไม่ได้");
    }
  };

  const runAI = async () => {
    if (stocks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`${API_BASE}/ai-analyze`, stocks);
      setAiAnalysis(res.data.analysis);
    } catch (err) { alert("AI Analysis failed."); }
    finally { setIsAnalyzing(false); }
  };

  // UI Helpers
  const status = (() => {
    const now = currentTime;
    const day = now.getDay(); 
    const timeStr = now.getHours() * 100 + now.getMinutes();
    if (day === 0 || day === 6) return { label: "MARKET CLOSED", color: "#ef4444" };
    const isOpen = (timeStr >= 1000 && timeStr <= 1230) || (timeStr >= 1430 && timeStr <= 1630);
    return isOpen ? { label: "MARKET OPEN", color: "#22c55e" } : { label: "MARKET CLOSED", color: "#ef4444" };
  })();

  if (loading) return <div style={{backgroundColor:'#0f172a', height:'100vh'}} />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        // --- ส่วนการแสดงผล (JSX) ---
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>SET AI TERMINAL</h1>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
              <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Wallet size={16} />
                <span>ID: <strong>{accountInfo.account_no}</strong></span>
              </div>
              <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <TrendingUp size={16} />
                <span>Cash: <strong>฿{Number(accountInfo.line_available).toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
          
          {/* ส่วนเวลาเปิด-ปิดตลาดที่ขอกลับมา */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentTime.toLocaleTimeString('th-TH')}</div>
            <div style={{ color: marketStatus.color, fontSize: '0.85rem', fontWeight: 'bold' }}>
              ● {marketStatus.label}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
          
          {/* Main Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Live Portfolio Section */}
            <div style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '25px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Briefcase color="#38bdf8" />
                <h3 style={{ margin: 0 }}>พอร์ตปัจจุบัน (Live Portfolio)</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.8rem', borderBottom: '1px solid #334155' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>SYMBOL</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>VOLUME</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>AVG COST</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>MARKET PRICE</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>P/L %</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.length > 0 ? portfolio.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.symbol}</td>
                      <td style={{ textAlign: 'right' }}>{p.actual_volume}</td>
                      <td style={{ textAlign: 'right' }}>{p.average_cost}</td>
                      <td style={{ textAlign: 'right' }}>{p.market_price}</td>
                      <td style={{ textAlign: 'right', color: p.profit_loss_pct >= 0 ? '#4ade80' : '#f87171' }}>
                        {p.profit_loss_pct}%
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#475569' }}>ยังไม่มีหุ้นในพอร์ต</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Watchlist Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {stocks.map((stock) => (
                <div key={stock.symbol} style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '20px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '800', color: '#94a3b8' }}>{stock.symbol}</span>
                    <span style={{ color: stock.pct_val >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{stock.pct}</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '15px' }}>฿{stock.price}</div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => { setTradeData({ symbol: stock.symbol, side: 'BUY', volume: 100 }); setShowTradeModal(true); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => { setTradeData({ symbol: stock.symbol, side: 'SELL', volume: 100 }); setShowTradeModal(true); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      SELL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: AI Analysis */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '28px', padding: '25px', border: '2px solid #38bdf8', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <BrainCircuit color="#38bdf8" size={28} />
              <h3 style={{ margin: 0, color: '#38bdf8' }}>AI Insights</h3>
            </div>
            <button 
              onClick={runAI} 
              disabled={isAnalyzing}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '20px' }}
            >
              {isAnalyzing ? "Analyzing..." : "🪄 วิเคราะห์พอร์ต"}
            </button>
            <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.6', minHeight: '300px', whiteSpace: 'pre-wrap' }}>
              {aiAnalysis || "กดปุ่มเพื่อเริ่มวิเคราะห์..."}
            </div>
          </div>

        </div>
      </div>

      {/* Trade Modal Overlay */}
      {showTradeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '24px', width: '400px', border: '1px solid #38bdf8' }}>
            <h2 style={{ marginTop: 0 }}>Confirm Order</h2>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '12px' }}>
              <div style={{ color: tradeData.side === 'BUY' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{tradeData.side} ORDER</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{tradeData.symbol}</div>
            </div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>จำนวนหุ้น (Volume):</label>
            <input 
              type="number" 
              value={tradeData.volume}
              onChange={(e) => setTradeData({...tradeData, volume: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '25px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowTradeModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: '#475569', color: 'white', border: 'none' }}>ยกเลิก</button>
              <button onClick={handleTrade} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none' }}>ยืนยันส่งคำสั่ง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;