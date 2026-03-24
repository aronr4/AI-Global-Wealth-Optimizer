import React, { useState, useEffect } from 'react';
import API from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { AlertCircle, Target, TrendingUp, Zap, MapPin, Loader2, Pencil, Check, X, Wallet, PiggyBank, TrendingDown } from 'lucide-react';

const Dashboard = () => {
    const [aiData, setAiData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Manual Income State ─────────────────────────────────────────────
    const userEmail = localStorage.getItem('userEmail') || 'guest';
    const [income, setIncome] = useState(() => {
        const saved = localStorage.getItem(`${userEmail}_userIncome`);
        return saved ? Number(saved) : null;
    });
    const [editingIncome, setEditingIncome] = useState(false);
    const [incomeInput, setIncomeInput] = useState('');

    const handleSaveIncome = () => {
        const val = parseFloat(incomeInput.replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
            setIncome(val);
            localStorage.setItem(`${userEmail}_userIncome`, val);
            API.post('/sync/save_data', { income: val }).catch(() => { });
        }
        setEditingIncome(false);
        setIncomeInput('');
    };

    const handleCancelIncome = () => {
        setEditingIncome(false);
        setIncomeInput('');
    };


    // ── Risk Profile State ──────────────────────────────────────────────
    const [riskProfile, setRiskProfile] = useState(() => {
        return localStorage.getItem(`${userEmail}_riskProfile`) || 'medium';
    });

    const handleRiskChange = (level) => {
        setRiskProfile(level);
        localStorage.setItem(`${userEmail}_riskProfile`, level);
        API.post('/sync/save_data', { riskProfile: level }).catch(() => { });
    };
    // ───────────────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchAiData = async () => {
            if (!income) {
                setLoading(false);
                return;
            }
            try {
                const res = await API.post('/ai/recommend', {
                    savings_budget: income * 0.3,
                    risk_profile: riskProfile
                });
                setAiData(res.data?.status === "success" ? res.data : null);
            } catch (error) {
                console.error('Failed to fetch AI MCP Data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAiData();
    }, [income, riskProfile]);

    return (
        <div className="dashboard-content grid" style={{ gap: '1.5rem', gridTemplateColumns: 'repeat(12, 1fr)' }}>
            {/* Total Wealth / Income Card */}
            <div className="glass-panel animate-fade-in" style={{ gridColumn: 'span 3', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    <TrendingUp size={16} color="var(--accent-color)" /> Monthly Income
                </h3>

                {editingIncome ? (
                    // ── Edit mode ───────────────────────────────────
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--accent-color)', borderRadius: '10px', padding: '6px 12px', gap: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>₹</span>
                            <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter your income"
                                value={incomeInput}
                                onChange={e => setIncomeInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveIncome(); if (e.key === 'Escape') handleCancelIncome(); }}
                                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '1.1rem', width: '100%', fontWeight: 600 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleSaveIncome} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px', background: 'rgba(46,160,67,0.2)', border: '1px solid rgba(46,160,67,0.4)', borderRadius: '8px', color: 'var(--success-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                <Check size={14} /> Save
                            </button>
                            <button onClick={handleCancelIncome} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px', background: 'rgba(218,54,51,0.15)', border: '1px solid rgba(218,54,51,0.3)', borderRadius: '8px', color: 'var(--danger-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                <X size={14} /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    // ── Display mode ────────────────────────────────
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <h2 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>
                                {income ? `₹${income.toLocaleString('en-IN')}` : '₹ --'}
                            </h2>
                            <button
                                onClick={() => { setEditingIncome(true); setIncomeInput(income ? String(income) : ''); }}
                                title="Edit income"
                                style={{ background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.25)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', transition: 'all 0.2s' }}
                            >
                                <Pencil size={13} /> Edit
                            </button>
                        </div>
                        <p style={{ color: income ? 'var(--success-color)' : 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                            {income ? `Savings target: ₹${Math.round(income * 0.3).toLocaleString('en-IN')}/mo` : 'Tap Edit to enter your income'}
                        </p>
                    </div>
                )}
            </div>

            <div className="glass-panel animate-fade-in" style={{ gridColumn: 'span 3', padding: '1.5rem', animationDelay: '0.1s' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={16} color="var(--success-color)" /> Recommended Monthly Invest
                </h3>
                <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
                    {income
                        ? `₹${Math.round(income * 0.3).toLocaleString('en-IN')}`
                        : '₹--'}
                </h2>
                <p style={{ color: 'var(--success-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{income ? '30% of your monthly income' : 'Set income first'}</span>
                </p>
            </div>

            {/* Risk Profile Card */}
            <div className="glass-panel animate-fade-in" style={{ gridColumn: 'span 3', padding: '1.5rem', animationDelay: '0.2s', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(46, 160, 67, 0.1) 100%)' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Zap size={16} color="var(--warning-color)" /> Risk Invest
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        { level: 'high', label: 'High', color: '#ef5350', bg: 'rgba(239,83,80,0.15)', border: 'rgba(239,83,80,0.4)' },
                        { level: 'medium', label: 'Medium', color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.4)' },
                        { level: 'low', label: 'Low', color: '#00e5b4', bg: 'rgba(0,229,180,0.15)', border: 'rgba(0,229,180,0.4)' },
                    ].map(({ level, label, color, bg, border }) => (
                        <button
                            key={level}
                            onClick={() => handleRiskChange(level)}
                            style={{
                                width: '100%', padding: '14px 0', borderRadius: '10px', cursor: 'pointer',
                                fontSize: '1rem', fontWeight: 700, transition: 'all 0.2s', letterSpacing: '0.5px',
                                background: riskProfile === level ? bg : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${riskProfile === level ? border : 'rgba(255,255,255,0.1)'}`,
                                color: riskProfile === level ? color : 'var(--text-secondary)',
                                boxShadow: riskProfile === level ? `0 0 16px ${bg}` : 'none',
                                transform: riskProfile === level ? 'scale(1.04)' : 'scale(1)',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-panel animate-fade-in flex-col" style={{ gridColumn: 'span 3', padding: '1.5rem', animationDelay: '0.3s', gap: '1rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={14} color="#ef5350" /> This Month
                </h3>

                {/* Expenses this month */}
                {(() => {
                    const expenses = (() => { try { return JSON.parse(localStorage.getItem(`${userEmail}_expenses_v2`) || '[]'); } catch { return []; } })();
                    const now = new Date();
                    const monthExpenses = expenses.filter(e => {
                        try { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; }
                    });
                    const total = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                    return (
                        <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.75rem 1rem', borderLeft: '3px solid #ef5350' }}>
                            <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</div>
                            <div style={{ color: '#ef5350', fontSize: '1.4rem', fontWeight: 700 }}>₹{total.toLocaleString('en-IN')}</div>
                            <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>{monthExpenses.length} transaction{monthExpenses.length !== 1 ? 's' : ''}</div>
                        </div>
                    );
                })()}

                {/* Goals summary */}
                {(() => {
                    const goals = (() => { try { return JSON.parse(localStorage.getItem(`${userEmail}_savingsGoals_v2`) || '[]'); } catch { return []; } })();
                    if (goals.length === 0) return (
                        <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.75rem 1rem', borderLeft: '3px solid #00e5b4' }}>
                            <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Savings Goals</div>
                            <div style={{ color: '#8b949e', fontSize: '0.85rem', marginTop: 4 }}>No goals set yet</div>
                        </div>
                    );
                    const totalTarget = goals.reduce((s, g) => s + g.target, 0);
                    const totalSaved = goals.reduce((s, g) => s + g.current, 0);
                    const pct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
                    return (
                        <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.75rem 1rem', borderLeft: '3px solid #00e5b4' }}>
                            <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Goals · {goals.length} active</div>
                            <div style={{ color: '#00e5b4', fontSize: '1.1rem', fontWeight: 700 }}>₹{totalSaved.toLocaleString('en-IN')} <span style={{ color: '#8b949e', fontSize: '0.75rem', fontWeight: 400 }}>saved</span></div>
                            <div style={{ background: '#21262d', borderRadius: 99, height: 5, margin: '6px 0 3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#00e5b4', borderRadius: 99 }} />
                            </div>
                            <div style={{ color: '#8b949e', fontSize: '0.7rem' }}>{pct}% of ₹{totalTarget.toLocaleString('en-IN')} goal</div>
                        </div>
                    );
                })()}
            </div>

            {/* ── Portfolio Breakdown Chart ─────────────────────────────── */}
            <div className="glass-panel animate-fade-in flex-col" style={{ gridColumn: 'span 8', padding: '1.5rem', minHeight: '350px', animationDelay: '0.4s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                    <div style={{ width: 3, height: 20, background: '#58a6ff', borderRadius: 2 }} />
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Income Breakdown</h3>
                    {income && <span style={{ background: 'rgba(88,166,255,0.12)', color: '#58a6ff', border: '1px solid rgba(88,166,255,0.3)', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>Monthly · ₹{income.toLocaleString('en-IN')}</span>}
                </div>

                {!income ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b949e', gap: 12 }}>
                        <Wallet size={36} color="#30363d" />
                        <p style={{ margin: 0, fontSize: '0.88rem' }}>Set your monthly income above to see your breakdown.</p>
                    </div>
                ) : (() => {
                    const expenses = Math.round(income * 0.50);
                    const savings = Math.round(income * 0.20);
                    const investment = Math.round(income * 0.30);
                    const bars = [
                        { label: 'Expenses', amount: expenses, pct: 50, color: '#ef5350' },
                        { label: 'Savings', amount: savings, pct: 20, color: '#00e5b4' },
                        { label: 'Investment', amount: investment, pct: 30, color: '#58a6ff' },
                    ];
                    return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                                {bars.map(b => (
                                    <div key={b.label} style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem', borderLeft: `3px solid ${b.color}` }}>
                                        <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{b.label}</div>
                                        <div style={{ color: b.color, fontSize: '1.3rem', fontWeight: 700, margin: '2px 0' }}>₹{b.amount.toLocaleString('en-IN')}</div>
                                        <div style={{ color: '#8b949e', fontSize: '0.75rem' }}>{b.pct}% of income</div>
                                    </div>
                                ))}
                            </div>
                            {/* Bar chart */}
                            <div style={{ flex: 1, minHeight: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bars} barSize={48} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b949e', fontSize: 13 }} />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                            contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#fff', fontSize: '0.82rem' }}
                                            formatter={(v, n, p) => [`₹${v.toLocaleString('en-IN')} (${p.payload.pct}%)`, p.payload.label]}
                                        />
                                        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                            {bars.map((b, i) => <Cell key={i} fill={b.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })()}
            </div>




        </div>
    );
};

export default Dashboard;
