import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Activity, Loader2, RefreshCw, BarChart2, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Zap, X, Flame, Clock, Leaf } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api';

const Portfolio = () => {
    // ── Read from Dashboard localStorage ─────────────────────────────────
    const userEmail = localStorage.getItem('userEmail') || 'guest';
    const income = Number(localStorage.getItem(`${userEmail}_userIncome`) || 0);
    const riskProfile = localStorage.getItem(`${userEmail}_riskProfile`) || 'medium';
    const investBudget = income ? Math.round(income * 0.3) : 0;
    // ─────────────────────────────────────────────────────────────────────

    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stocks');
    const [savings, setSavings] = useState(investBudget);
    const [priceFlash, setPriceFlash] = useState({}); // symbol -> 'up' | 'down'
    const [marketOpen, setMarketOpen] = useState(null); // null=unknown, true, false
    const [nextOpen, setNextOpen] = useState('');       // e.g. "Mon, 09 Mar 2026 at 9:15 AM IST"
    const [wealthCreators, setWealthCreators] = useState([]); // symbols of top performers

    // Chart Modal States
    const [selectedStock, setSelectedStock] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [chartPeriod, setChartPeriod] = useState('1y');
    const [chartLoading, setChartLoading] = useState(false);
    const [chartType, setChartType] = useState('area'); // 'area' | 'candle'

    // AI States
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [capFilter, setCapFilter] = useState('All');

    const marketDataRef = useRef([]);
    const livePriceRef = useRef({});   // symbol -> latest price, written by fetchTick

    const fetchMarket = useCallback(async () => {
        try {
            const res = await API.get('/investments/market');
            const body = res.data || res;
            const data = Array.isArray(body) ? body : (body.data || []);
            const creators = body.wealth_creators || [];
            
            setMarketData(data);
            if (creators.length > 0) setWealthCreators(creators);
            
            marketDataRef.current = data;
            // Seed livePriceRef from fresh market data too
            data.forEach(s => { livePriceRef.current[s.symbol] = s.price; });
        } catch (e) {
            console.error("Failed to load market", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Live-tick: patch only price/change every second without refetching everything
    const fetchTick = useCallback(async () => {
        try {
            const res = await API.get('/investments/market/live-tick');
            const body = res.data || res;

            // New response shape: { market_open, next_open, ticks }
            const isOpen = body.market_open ?? true; // backward compat
            const ticks = Array.isArray(body) ? body : (body.ticks || []);
            const creators = body.wealth_creators || [];
            if (creators.length > 0) setWealthCreators(creators);

            setMarketOpen(isOpen);
            if (!isOpen) {
                setNextOpen(body.next_open || '');
                return; // no price updates when market is closed
            }

            if (!Array.isArray(ticks) || ticks.length === 0) return;

            const tickMap = {};
            ticks.forEach(t => { tickMap[t.symbol] = t; });

            const flashes = {};
            setMarketData(prev => prev.map(stock => {
                const tick = tickMap[stock.symbol];
                if (!tick) return stock;
                if (tick.price !== stock.price) {
                    flashes[stock.symbol] = tick.price > stock.price ? 'up' : 'down';
                }
                livePriceRef.current[stock.symbol] = tick.price;
                return { ...stock, price: tick.price, change: tick.change, changePercent: tick.changePercent };
            }));

            if (Object.keys(flashes).length > 0) {
                setPriceFlash(flashes);
                setTimeout(() => setPriceFlash({}), 600);
            }
        } catch (e) {
            // Log tick failures for debugging but don't stop the loop
            console.warn("Live tick fetch failed:", e);
        }
    }, []);

    const fetchAI = async () => {
        setAiLoading(true);
        try {
            const aiRes = await API.post('/ai/recommend', {
                savings_budget: investBudget,
                risk_profile: riskProfile
            });
            setAiData(aiRes.data);
        } catch (e) {
            console.error('Failed to fetch AI data', e);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchMarket();
        fetchAI();

        const fullRefresh = setInterval(() => {
            fetchMarket().catch(err => console.error("Market refresh failed:", err));
        }, 60000); // Increased to 60s for full market refresh (ticks handle 1s updates)

        const tickInterval = setInterval(() => {
            fetchTick().catch(err => console.error("Tick update failed:", err));
        }, 1000);

        return () => {
            clearInterval(fullRefresh);
            clearInterval(tickInterval);
        };
    }, [savings, fetchMarket, fetchTick]);


    useEffect(() => {
        if (!selectedStock) return;
        let fullTimer = null;
        let tickTimer = null;

        const loadChart = async () => {
            try {
                const symbol = selectedStock.symbol.replace('.NS', '');
                const res = await API.get(`/investments/market/${symbol}/history?period=${chartPeriod}`);
                const data = res.data || res;
                if (Array.isArray(data) && data.length > 0) setChartData(data);
            } catch (e) {
                console.error("Failed to load chart", e);
            } finally {
                setChartLoading(false);
            }
        };

        setChartLoading(true);
        loadChart();

        if (chartPeriod === '1d') {
            // Full data reload every 30s to resync with server
            fullTimer = setInterval(loadChart, 30000);

            // Every second: grow current candle or start a new one each new minute
            tickTimer = setInterval(() => {
                const livePrice = livePriceRef.current[selectedStock.symbol];
                if (!livePrice) return;

                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                setChartData(prev => {
                    if (!prev || prev.length === 0) return prev;
                    const updated = [...prev];
                    const last = updated[updated.length - 1];

                    if (last.time !== timeStr) {
                        // New minute → open a fresh candle
                        updated.push({
                            time: timeStr,
                            open: livePrice,
                            high: livePrice,
                            low: livePrice,
                            close: livePrice,
                            price: livePrice,
                        });
                    } else {
                        // Same minute → grow existing candle
                        const growing = { ...last };
                        growing.close = livePrice;
                        growing.price = livePrice;
                        growing.high = Math.max(growing.high, livePrice);
                        growing.low = Math.min(growing.low, livePrice);
                        updated[updated.length - 1] = growing;
                    }
                    return updated;
                });
            }, 1000);
        }

        return () => {
            if (fullTimer) clearInterval(fullTimer);
            if (tickTimer) clearInterval(tickTimer);
        };
        // ⚠️ Do NOT add marketData here — use livePriceRef to avoid blinking
    }, [selectedStock, chartPeriod]);




    return (
        <div className="flex-col animate-fade-in" style={{ width: '100%', gap: '1.5rem', background: '#0e1117', color: '#c9d1d9', minHeight: '100vh', paddingBottom: '2rem' }}>

            {/* ── Smart Investment Summary Banner ──────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(88,166,255,0.08) 0%, rgba(63,185,80,0.08) 100%)',
                border: '1px solid rgba(88,166,255,0.2)', borderRadius: 16, padding: '1.5rem 2rem',
                display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap'
            }}>
                {/* Income + Budget */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Income</span>
                    <span style={{ color: 'white', fontSize: '1.6rem', fontWeight: 700 }}>
                        {income ? `₹${income.toLocaleString('en-IN')}` : <span style={{ color: '#8b949e', fontSize: '1rem' }}>Not set — go to Dashboard</span>}
                    </span>
                </div>
                <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Investment Budget (30%)</span>
                    <span style={{ color: 'var(--success-color)', fontSize: '1.6rem', fontWeight: 700 }}>₹{investBudget.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }} />
                {/* Risk badge */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Level</span>
                    <span style={{
                        fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize',
                        color: riskProfile === 'high' ? '#ef5350' : riskProfile === 'medium' ? '#ffd700' : '#00e5b4'
                    }}>
                        {riskProfile === 'high' ? '🔴' : riskProfile === 'medium' ? '🟡' : '🟢'} {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
                    </span>
                </div>
                <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }} />
                {/* Strategy label */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strategy</span>
                    <span style={{
                        fontSize: '1rem', fontWeight: 700,
                        color: riskProfile === 'high' ? '#ef5350' : riskProfile === 'medium' ? '#ffd700' : '#00e5b4'
                    }}>
                        {riskProfile === 'high' ? <><Flame size={16} style={{ display: 'inline', marginRight: 4 }} />Intraday Trading</> :
                            riskProfile === 'medium' ? <><Clock size={16} style={{ display: 'inline', marginRight: 4 }} />Scalping</> :
                                <><Leaf size={16} style={{ display: 'inline', marginRight: 4 }} />Long-term Investing</>}
                    </span>
                </div>
            </div>

            {/* ── Smart Stock Suggestions ───────────────────────────────── */}
            {(() => {
                if (investBudget <= 0) {
                    return (
                        <div style={{
                            background: '#0e1117', border: '1px solid #30363d',
                            borderRadius: 16, padding: '2.5rem 1.5rem', textAlign: 'center'
                        }}>
                            <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Investment Budget Set</h2>
                            <p style={{ color: '#8b949e', fontSize: '0.9rem' }}>Please enter your Monthly Income in the Dashboard to unlock AI-tailored stock suggestions.</p>
                        </div>
                    );
                }

                const recTickers = aiData?.model_predictions?.rag_recommended_tickers || [];

                // Strategy-based filter from live market data
                const allStocks = marketData.filter(s => s.region === 'indian');

                let suggestions = [];
                let strategyTitle = '';
                let strategyDesc = '';
                let strategyColor = '';
                let StrategyIcon = Zap;

                if (riskProfile === 'high') {
                    strategyTitle = 'Aggressive Growth & Intraday (High Risk)';
                    strategyDesc = `Stocks with the strongest price momentum — best for high risk trades within ₹${investBudget.toLocaleString('en-IN')} budget.`;
                    strategyColor = '#ef5350';
                    StrategyIcon = Flame;

                    let pool = allStocks.filter(s => s.price <= investBudget);

                    if (investBudget >= 5000) {
                        // High budget: avoid pure penny stocks, target volatile Mid/Small caps
                        pool = pool.filter(s => s.price >= 50 && (s.market_cap === 'Mid Cap' || s.market_cap === 'Small Cap'));
                    } else {
                        // Low budget: target cheaper stocks/microcaps
                        pool = pool.filter(s => s.price < 200 || s.market_cap === 'Small Cap');
                    }

                    suggestions = pool
                        .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
                        .slice(0, 6);

                } else if (riskProfile === 'medium') {
                    strategyTitle = 'Balanced Scalping Picks (Medium Risk)';
                    strategyDesc = `Stocks with consistent positive movement — ideal for short-term balanced growth within ₹${investBudget.toLocaleString('en-IN')} budget.`;
                    strategyColor = '#ffd700';
                    StrategyIcon = Clock;

                    let pool = allStocks.filter(s => s.price <= investBudget);

                    if (investBudget >= 2000) {
                        // Medium/High budget: Standard Mid Caps
                        pool = pool.filter(s => s.market_cap === 'Mid Cap' || (s.market_cap === 'Large Cap' && s.price < 1000));
                    } else {
                        // Low budget: Fallback to more affordable Small Caps if Mid are too expensive
                        pool = pool.filter(s => s.market_cap === 'Small Cap' || s.market_cap === 'Mid Cap');
                    }

                    suggestions = pool
                        .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
                        .slice(0, 6);

                } else {
                    strategyTitle = 'Long-term Investment Picks (Low Risk)';
                    strategyDesc = `Fundamentally strong stocks — best for long-term safe investing within ₹${investBudget.toLocaleString('en-IN')} budget.`;
                    strategyColor = '#00e5b4';
                    StrategyIcon = Leaf;

                    let pool = allStocks.filter(s => s.price <= investBudget);

                    // Prefer AI recs first
                    const aiPicks = pool.filter(s => {
                        const sym = `${s.symbol}.NS`;
                        return recTickers.includes(sym) || recTickers.includes(s.symbol);
                    });

                    if (investBudget >= 1500) {
                        // Healthy budget: Target blue-chip Large Caps
                        pool = pool.filter(s => s.market_cap === 'Large Cap');
                    } else {
                        // Low budget: Fall back to stable Mid caps if Large caps are out of reach
                        pool = pool.filter(s => s.market_cap === 'Mid Cap' || s.market_cap === 'Large Cap');
                    }

                    const safePicks = pool.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
                    suggestions = [...new Map([...aiPicks, ...safePicks].map(s => [s.symbol, s])).values()].slice(0, 6);
                }

                if (suggestions.length === 0) return null;

                return (
                    <div style={{
                        background: '#0e1117', border: `1px solid ${strategyColor}33`,
                        borderRadius: 16, padding: '1.5rem',
                        boxShadow: `0 0 30px ${strategyColor}15`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
                            <StrategyIcon size={20} color={strategyColor} />
                            <h2 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 700 }}>{strategyTitle}</h2>
                            <span style={{
                                background: `${strategyColor}22`, color: strategyColor,
                                border: `1px solid ${strategyColor}55`, padding: '2px 12px',
                                borderRadius: 10, fontSize: '0.72rem', fontWeight: 700
                            }}>AI + Historical Analysis</span>
                        </div>
                        <p style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{strategyDesc}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {suggestions.map((s, i) => {
                                const isAiPick = recTickers.includes(`${s.symbol}.NS`) || recTickers.includes(s.symbol);
                                const up = s.change >= 0;
                                return (
                                    <div key={i} onClick={() => setSelectedStock(s)} style={{
                                        background: '#161b22', border: `1px solid ${isAiPick ? strategyColor + '66' : '#30363d'}`,
                                        borderRadius: 12, padding: '1rem', cursor: 'pointer', position: 'relative',
                                        boxShadow: isAiPick ? `0 0 12px ${strategyColor}22` : 'none',
                                        transition: 'border-color 0.2s'
                                    }}>
                                        {isAiPick && (
                                            <div style={{ position: 'absolute', top: -10, right: 10, background: strategyColor, color: '#000', padding: '2px 10px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700 }}>
                                                ⚡ AI Pick
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{s.symbol}</div>
                                                <div style={{ color: '#8b949e', fontSize: '0.72rem', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                            </div>
                                            <span style={{ color: '#8b949e', fontSize: '0.68rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 6 }}>{s.market_cap}</span>
                                        </div>
                                        <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>₹{s.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.78rem', color: up ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {s.change > 0 ? '+' : ''}{s.change?.toFixed(2)} ({s.changePercent?.toFixed(2)}%)
                                        </div>
                                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #21262d', fontSize: '0.72rem', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Can buy: <strong style={{ color: 'white' }}>{Math.floor(investBudget / s.price)} shares</strong></span>
                                            <span style={{ color: s.risk === 'Low Risk' ? 'var(--success-color)' : 'var(--warning-color)' }}>{s.risk || s.sector}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* ── Stop Rendering if No Budget ───────────────────────────── */}
            {investBudget <= 0 ? null : (
                <>
                    <div className="flex items-center justify-between" style={{ padding: '0.5rem 0' }}>
                        <div className="flex items-center gap-3">
                            <BarChart2 size={24} color="var(--accent-color)" />
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: 'white' }}>
                                {activeTab === 'stocks' ? 'Indian Stock Market' : 'Global Stocks'}
                            </h1>
                            {activeTab === 'stocks' && (
                                marketOpen === true ? (
                                    <span style={{ background: 'rgba(46,160,67,0.2)', color: 'var(--success-color)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block' }} />
                                        NSE Open · Live
                                    </span>
                                ) : marketOpen === false ? (
                                    <span title={nextOpen ? `Next open: ${nextOpen}` : ''} style={{ background: 'rgba(248,81,73,0.12)', color: '#f85149', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'help' }}>
                                        ◉ Market Closed {nextOpen && <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#8b949e' }}>· Opens {nextOpen}</span>}
                                    </span>
                                ) : null
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {activeTab === 'stocks' && marketOpen === true && (
                                <div className="flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '16px' }}>
                                    <div className="animate-pulse" style={{ width: 14, height: 14, borderRadius: '7px', background: 'var(--success-color)' }} />
                                    <span style={{ fontSize: '0.85rem' }}>Live Ticks</span>
                                    <span style={{ fontSize: '0.8rem', background: 'var(--success-color)', color: 'black', padding: '2px 6px', borderRadius: '4px', marginLeft: 8 }}>1s</span>
                                </div>
                            )}
                            <button
                                onClick={() => { fetchMarket(); fetchTick(); fetchAI(); }}
                                disabled={loading || aiLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px', background: '#161b22', border: '1px solid #30363d',
                                    borderRadius: 8, color: '#c9d1d9', cursor: loading || aiLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.82rem', opacity: loading || aiLoading ? 0.7 : 1, transition: 'opacity 0.2s'
                                }}
                            >
                                <RefreshCw size={13} style={{ animation: loading || aiLoading ? 'spin 1s linear infinite' : 'none' }} />
                                {loading || aiLoading ? 'Refreshing…' : 'Refresh'}
                            </button>
                        </div>
                    </div>





                    {/* View Switcher Tabs */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', width: 'max-content', marginBottom: '1.5rem' }}>
                        <button onClick={() => setActiveTab('stocks')} style={{ background: activeTab === 'stocks' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'stocks' ? 'white' : '#8b949e', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Indian Stocks</button>
                        <button onClick={() => setActiveTab('global')} style={{ background: activeTab === 'global' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'global' ? 'white' : '#8b949e', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Global Assets</button>
                    </div>

                    {/* STOCKS & GLOBAL VIEW */}
                    {(activeTab === 'stocks' || activeTab === 'global') && (
                        <>


                            {loading && (!marketData || !Array.isArray(marketData) || marketData.length === 0) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: 12 }}>
                                    <Loader2 size={32} color="var(--accent-color)" style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ color: '#8b949e', fontSize: '0.88rem' }}>Loading live stock data…</span>
                                </div>
                            ) : (() => {
                                const regionStocks = marketData.filter(s =>
                                    activeTab === 'stocks' ? s.region === 'indian' : s.region === 'global'
                                ).filter(s => s.price <= Number(savings));

                                const recTickers = aiData?.model_predictions?.rag_recommended_tickers || [];
                                const stockTiers = aiData?.model_predictions?.stock_tiers || {};

                                const isRec = s => {
                                    const sym = s.region === 'global' ? s.symbol : `${s.symbol}.NS`;
                                    return recTickers.includes(sym) || recTickers.includes(s.symbol);
                                };
                                const getTier = s => {
                                    const sym = s.region === 'global' ? s.symbol : `${s.symbol}.NS`;
                                    return stockTiers[sym] || stockTiers[s.symbol] || null;
                                };
                                const getPredReturn = tier => {
                                    const map = { 'High Return': '22–35%', 'Medium Return': '14–22%', 'Normal Return': '9–14%', 'Stable Return': '7–12%' };
                                    return map[tier] || '10–18%';
                                };
                                const getTierColor = tier => {
                                    const map = { 'High Return': '#f0b429', 'Medium Return': '#58a6ff', 'Normal Return': '#3fb950', 'Stable Return': '#8b949e' };
                                    return map[tier] || '#8b949e';
                                };

                                 const recommended = (() => {
                                    // Region-specific pool for wealth creators
                                    const pool = marketData.filter(s =>
                                        activeTab === 'stocks' ? s.region === 'indian' : s.region === 'global'
                                    );
                                    
                                    if (wealthCreators.length > 0) {
                                        return pool.filter(s => (wealthCreators.includes(s.symbol) || wealthCreators.includes(`${s.symbol}.NS`)) && s.price <= Number(savings));
                                    }
                                    return regionStocks.filter(isRec).sort((a, b) => {
                                        const tierValue = { 'High Return': 3, 'Medium Return': 2, 'Normal Return': 1, 'Stable Return': 1 };
                                        return (tierValue[getTier(b)] || 0) - (tierValue[getTier(a)] || 0);
                                    });
                                })();

                                // Group all stocks by sector
                                const sectors = {};
                                regionStocks.forEach(s => {
                                    const sec = s.sector || 'Other';
                                    if (!sectors[sec]) sectors[sec] = [];
                                    sectors[sec].push(s);
                                });

                                const StockCard = ({ stock, compact = false }) => {
                                    const tier = getTier(stock);
                                    const rec = isRec(stock);
                                    const flash = priceFlash[stock.symbol];
                                    return (
                                        <div onClick={() => setSelectedStock(stock)} style={{
                                            background: rec ? 'rgba(46,160,67,0.05)' : '#161b22',
                                            border: `1px solid ${rec ? 'rgba(46,160,67,0.3)' : '#30363d'}`,
                                            borderRadius: 12, padding: compact ? '1rem' : '1.25rem',
                                            cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                                            flexShrink: 0, width: compact ? 220 : '100%',
                                            position: 'relative', minHeight: '140px', display: 'flex', flexDirection: 'column'
                                        }}>
                                            {tier && (
                                                <div style={{ position: 'absolute', top: -10, right: 12, background: getTierColor(tier), color: '#000', padding: '2px 10px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Zap size={9} />{tier}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{stock.symbol}</div>
                                                    <div style={{ color: '#8b949e', fontSize: '0.75rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</div>
                                                </div>
                                                <span style={{ background: 'rgba(139,148,158,0.1)', border: '1px solid #30363d', color: '#8b949e', padding: '1px 7px', borderRadius: 8, fontSize: '0.7rem' }}>{stock.sector}</span>
                                            </div>
                                            <div style={{
                                                color: flash === 'up' ? '#2ea043' : flash === 'down' ? '#f85149' : 'white',
                                                fontSize: '1.35rem', fontWeight: 700,
                                                background: flash === 'up' ? 'rgba(46,160,67,0.12)' : flash === 'down' ? 'rgba(248,81,73,0.12)' : 'transparent',
                                                borderRadius: 6, padding: '1px 4px', transition: 'all 0.3s', display: 'inline-block',
                                            }}>₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '0.8rem', color: stock.change >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                                {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%)
                                            </div>
                                            {rec && tier && (
                                                <div style={{ marginTop: 'auto', borderTop: '1px solid #21262d', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem' }}>
                                                    <span style={{ color: '#8b949e' }}>🎯 Predicted Return</span>
                                                    <span style={{ color: getTierColor(tier), fontWeight: 700 }}>{getPredReturn(tier)}</span>
                                                </div>
                                            )}
                                            {!compact && (
                                                <div style={{ marginTop: (!rec || !tier) ? 'auto' : 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: '#8b949e' }}>
                                                    <span>{stock.market_cap}</span>
                                                    <span style={{ color: stock.risk === 'Low Risk' ? 'var(--success-color)' : 'var(--warning-color)' }}>{stock.risk}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                };

                                return (
                                    <>
                                        {/* ── Recommended for You ── */}
                                        {recommended.length > 0 && (
                                            <div style={{ marginBottom: '2.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                                                    <Zap size={18} color="#f0b429" />
                                                    <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'white', fontWeight: 700 }}>All Time Best Returns</h2>
                                                    <span style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)', padding: '2px 10px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 }}>Historical Top Performers</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingTop: '12px', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                                                    {recommended.map((stock, i) => (
                                                        <StockCard key={i} stock={stock} compact />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── All Stocks by Sector ── */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                                                <BarChart2 size={18} color="#58a6ff" />
                                                <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'white', fontWeight: 700 }}>All Stocks</h2>
                                                <span style={{ color: '#8b949e', fontSize: '0.82rem' }}>within ₹{Number(savings).toLocaleString('en-IN')} budget · grouped by sector</span>
                                            </div>

                                             {Object.keys(sectors).length === 0 ? (
                                                <div style={{ color: '#8b949e', textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed #30363d', minWidth: '100%' }}>
                                                    <div style={{ fontSize: '1.2rem', color: 'white', marginBottom: '0.5rem' }}>No stocks found under ₹{Number(savings).toLocaleString('en-IN')}</div>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#8b949e' }}>
                                                        {loading ? "Still gathering market data... check back in a few seconds." : 
                                                         "Try increasing your Monthly Income on the Dashboard to see more investment options."}
                                                    </p>
                                                    {!loading && (
                                                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.75rem', border: '1px solid #30363d', padding: '4px 12px', borderRadius: 20 }}>💡 Tip: Look for 'Small Cap' stocks</span>
                                                        </div>
                                                    )}
                                                </div>
                                             ) : (
                                                Object.entries(sectors).sort(([a], [b]) => a.localeCompare(b)).map(([sector, stocks]) => (
                                                    <div key={sector} style={{ marginBottom: '2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                                                            <div style={{ width: 3, height: 16, background: '#58a6ff', borderRadius: 2 }} />
                                                            <span style={{ color: '#c9d1d9', fontWeight: 600, fontSize: '0.9rem' }}>{sector}</span>
                                                            <span style={{ color: '#8b949e', fontSize: '0.78rem' }}>({stocks.length})</span>
                                                        </div>
                                                        <div className="grid grid-cols-4" style={{ gap: '1rem', paddingTop: '12px' }}>
                                                            {stocks
                                                                .filter(s => capFilter === 'All' || s.market_cap === capFilter)
                                                                .map((stock, i) => <StockCard key={i} stock={stock} />)
                                                            }
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </>
                    )}
                </>
            )}

            {/* INTERACTIVE CHART MODAL */}
            {selectedStock && (() => {
                // Get the latest live price from marketData (updated every second)
                const liveStock = marketData.find(s => s.symbol === selectedStock.symbol) || selectedStock;
                const isUp = liveStock.change >= 0;
                const accentColor = isUp ? 'var(--success-color)' : 'var(--danger-color)';

                // Custom SVG Candlestick renderer
                const CandleChart = ({ data, height = 320 }) => {
                    if (!data || data.length === 0) return null;
                    const opens = data.map(d => d.open ?? d.price);
                    const highs = data.map(d => d.high ?? d.price);
                    const lows = data.map(d => d.low ?? d.price);
                    const closes = data.map(d => d.close ?? d.price);
                    const allPrices = [...opens, ...highs, ...lows, ...closes];
                    const minP = Math.min(...allPrices);
                    const maxP = Math.max(...allPrices);
                    const range = maxP - minP || 1;
                    const W = 900; const H = height;
                    const padL = 70; const padR = 20; const padT = 10; const padB = 28;
                    const chartW = W - padL - padR;
                    const chartH = H - padT - padB;
                    const n = data.length;
                    const candleW = Math.max(2, Math.min(12, chartW / n - 2));
                    const toY = p => padT + chartH - ((p - minP) / range) * chartH;
                    const toX = i => padL + (i + 0.5) * (chartW / n);

                    const labels = [];
                    const step = Math.max(1, Math.floor(n / 6));
                    for (let i = 0; i < n; i += step) {
                        labels.push({ x: toX(i), label: data[i].time?.slice(0, 5) || '' });
                    }
                    const priceLines = 5;
                    const gridLines = Array.from({ length: priceLines }, (_, i) => {
                        const p = minP + (range / (priceLines - 1)) * i;
                        return { y: toY(p), label: `₹${Math.round(p).toLocaleString('en-IN')}` };
                    });

                    return (
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
                            {/* Grid lines */}
                            {gridLines.map((gl, i) => (
                                <g key={i}>
                                    <line x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} stroke="#21262d" strokeWidth={1} />
                                    <text x={padL - 6} y={gl.y + 4} textAnchor="end" fill="#8b949e" fontSize={11}>{gl.label}</text>
                                </g>
                            ))}
                            {/* Candles */}
                            {data.map((d, i) => {
                                const o = opens[i]; const c = closes[i];
                                const h = highs[i]; const l = lows[i];
                                const bullish = c >= o;
                                const color = bullish ? '#2ea043' : '#f85149';
                                const bodyTop = toY(Math.max(o, c));
                                const bodyH = Math.max(1, Math.abs(toY(o) - toY(c)));
                                const x = toX(i);
                                return (
                                    <g key={i}>
                                        {/* Wick */}
                                        <line x1={x} y1={toY(h)} x2={x} y2={toY(l)} stroke={color} strokeWidth={1.5} />
                                        {/* Body */}
                                        <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH}
                                            fill={bullish ? color : color} opacity={0.9} rx={1} />
                                    </g>
                                );
                            })}
                            {/* X-axis labels */}
                            {labels.map((lb, i) => (
                                <text key={i} x={lb.x} y={H - 4} textAnchor="middle" fill="#8b949e" fontSize={10}>{lb.label}</text>
                            ))}
                        </svg>
                    );
                };

                return ReactDOM.createPortal(
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)',
                        zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
                    }} onClick={() => setSelectedStock(null)}>
                        <div className="glass-panel animate-fade-in" style={{
                            width: '100%', maxWidth: '860px', background: '#0e1117',
                            borderColor: '#30363d', padding: '2rem', borderRadius: '16px', position: 'relative'
                        }} onClick={e => e.stopPropagation()}>

                            {/* Close */}
                            <button onClick={() => setSelectedStock(null)} style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer'
                            }}><X size={24} /></button>

                            {/* Header: symbol + live price */}
                            <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h2 style={{ color: 'white', fontSize: '1.8rem', margin: 0 }}>{liveStock.symbol}</h2>
                                        {chartPeriod === '1d' && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(46,160,67,0.15)', border: '1px solid #2ea043', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', color: '#2ea043', fontWeight: 700 }}>
                                                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ea043', display: 'inline-block' }} />
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ color: '#8b949e', fontSize: '1rem' }}>{liveStock.name}</span>
                                </div>
                                <div style={{ marginLeft: 'auto', marginRight: '3rem', textAlign: 'right' }}>
                                    <h2 style={{
                                        margin: 0, fontSize: '1.8rem',
                                        color: priceFlash[liveStock.symbol] === 'up' ? '#2ea043'
                                            : priceFlash[liveStock.symbol] === 'down' ? '#f85149' : 'white',
                                        transition: 'color 0.3s'
                                    }}>₹{liveStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                                    <span style={{ color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                        {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {liveStock.change > 0 ? '+' : ''}{liveStock.change.toFixed(2)} ({liveStock.changePercent.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Toolbar: Period + Chart Type */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                {/* Period buttons */}
                                <div className="flex gap-2">
                                    {['1d', '5d', '1mo', '1y', '5y'].map(p => (
                                        <button key={p} onClick={() => setChartPeriod(p)} style={{
                                            background: chartPeriod === p ? 'rgba(46,160,67,0.2)' : 'transparent',
                                            color: chartPeriod === p ? 'var(--success-color)' : '#8b949e',
                                            border: chartPeriod === p ? '1px solid var(--success-color)' : '1px solid #30363d',
                                            padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', cursor: 'pointer',
                                            textTransform: 'uppercase', fontWeight: 600, transition: 'all 0.2s'
                                        }}>{p}</button>
                                    ))}
                                </div>

                                {/* Chart type toggle */}
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden', border: '1px solid #30363d' }}>
                                    {[['area', '📈 Area'], ['candle', '🕯 Candle']].map(([type, label]) => (
                                        <button key={type} onClick={() => setChartType(type)} style={{
                                            padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                            background: chartType === type ? 'rgba(88,166,255,0.2)' : 'transparent',
                                            color: chartType === type ? '#58a6ff' : '#8b949e',
                                            transition: 'all 0.2s'
                                        }}>{label}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div style={{ width: '100%', height: 340, position: 'relative' }}>
                                {chartLoading ? (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Loader2 className="animate-spin" size={32} color={accentColor} />
                                    </div>
                                ) : chartData?.length > 0 ? (
                                    chartType === 'candle' ? (
                                        <CandleChart data={chartData} height={320} />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time" stroke="#30363d" tick={{ fill: '#8b949e', fontSize: 12 }} minTickGap={30} />
                                                <YAxis domain={['auto', 'auto']} stroke="#30363d" tick={{ fill: '#8b949e', fontSize: 12 }} tickFormatter={val => `₹${val.toLocaleString('en-IN')}`} width={80} />
                                                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px', color: 'white' }} itemStyle={{ color: 'white', fontWeight: 'bold' }} />
                                                <Area type="monotone" dataKey="price" stroke={accentColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8b949e' }}>
                                        Historical data unavailable for this timeframe.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    , document.body);
            })()}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Portfolio;
