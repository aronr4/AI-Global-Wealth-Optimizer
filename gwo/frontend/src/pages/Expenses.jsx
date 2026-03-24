import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, Plus, Trash2, RefreshCw, TrendingDown, Calendar, ShoppingBag, Utensils, Car, Home, Tv, Zap, ShieldCheck, HeartPulse, GraduationCap, MoreHorizontal, Loader2 } from 'lucide-react';
import API from '../api';

// ── Category meta ──────────────────────────────────────────────────────────
const CAT = {
    'Food & Dining': { emoji: '🍔', color: '#f97316', Icon: Utensils },
    'Housing': { emoji: '🏠', color: '#58a6ff', Icon: Home },
    'Transportation': { emoji: '🚗', color: '#a78bfa', Icon: Car },
    'Entertainment': { emoji: '🎬', color: '#f0b429', Icon: Tv },
    'Utilities': { emoji: '⚡', color: '#3fb950', Icon: Zap },
    'Shopping': { emoji: '🛍️', color: '#ec4899', Icon: ShoppingBag },
    'Health': { emoji: '❤️', color: '#ef5350', Icon: HeartPulse },
    'Education': { emoji: '🎓', color: '#00e5b4', Icon: GraduationCap },
    'Insurance': { emoji: '🛡️', color: '#8b5cf6', Icon: ShieldCheck },
    'Other': { emoji: '📦', color: '#8b949e', Icon: MoreHorizontal },
};

const CATEGORIES = Object.keys(CAT);
const BASE_STORAGE_KEY = 'expenses_v2';

const today = () => new Date().toISOString().slice(0, 10);

const defaultForm = { amount: '', category: 'Food & Dining', description: '', date: today() };

const Expenses = () => {
    const userEmail = localStorage.getItem('userEmail') || 'guest';
    const STORAGE_KEY = `${userEmail}_${BASE_STORAGE_KEY}`;

    const income = Number(localStorage.getItem(`${userEmail}_userIncome`) || 0);
    const budget80 = income ? Math.round(income * 0.8) : 0; // 80% for expenses

    const [expenses, setExpenses] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    });
    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(false);
    const [synced, setSynced] = useState(false);

    // persist locally — this is the source of truth
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        // push full array to MongoDB
        API.post('/sync/save_data', { expenses: expenses }).then(() => setSynced(true)).catch(() => setSynced(false));
    }, [expenses]);

    // (Initial dummy loading logic removed - empty locally rules)
    useEffect(() => {
        // App starts clean; no backend mock fetched
    }, []);

    // ── helpers ─────────────────────────────────────────────────────────────
    const addExpense = () => {
        if (!form.amount || isNaN(Number(form.amount))) return;
        const exp = {
            id: Date.now(),
            category: form.category,
            amount: Math.abs(Number(form.amount)),
            description: form.description,
            date: form.date,
        };
        setExpenses(prev => [exp, ...prev]);
        // sync handled by useEffect
        setForm(defaultForm);
        setForm(defaultForm);
    };

    const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    // group by category for pie chart
    const byCategory = CATEGORIES.map(cat => ({
        name: cat,
        value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    })).filter(c => c.value > 0);

    const topCat = [...byCategory].sort((a, b) => b.value - a.value);

    const formatDate = (d) => {
        try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
        catch { return d; }
    };

    const remainingBudget = budget80 - totalSpent;
    const overBudget = income > 0 && remainingBudget < 0;

    return (
        <div style={{ paddingBottom: '3rem', color: '#c9d1d9', width: '100%' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.4rem' }}>
                <Wallet size={24} color="#58a6ff" />
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>Expense Tracking</h1>
                <span style={{ background: synced ? 'rgba(63,185,80,0.15)' : 'rgba(139,148,158,0.15)', color: synced ? '#3fb950' : '#8b949e', border: `1px solid ${synced ? 'rgba(63,185,80,0.3)' : 'rgba(139,148,158,0.3)'}`, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                    {synced ? '● Synced' : '○ Local'}
                </span>
            </div>
            <p style={{ margin: '0 0 1.5rem', color: '#8b949e', fontSize: '0.88rem' }}>
                Track every rupee. Stay within budget and identify where your money goes.
            </p>

            {/* ── Budget Banner ───────────────────────────────────────────── */}
            {income > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
                    background: overBudget ? 'rgba(239,83,80,0.07)' : 'linear-gradient(135deg, rgba(88,166,255,0.07) 0%, rgba(63,185,80,0.07) 100%)',
                    border: `1px solid ${overBudget ? 'rgba(239,83,80,0.3)' : 'rgba(88,166,255,0.18)'}`,
                    borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.5rem'
                }}>
                    <div>
                        <div style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Income</div>
                        <div style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>₹{income.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <div style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Spent</div>
                        <div style={{ color: overBudget ? '#ef5350' : '#f0b429', fontSize: '1.3rem', fontWeight: 700 }}>₹{totalSpent.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <div style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{overBudget ? 'Over Budget 🔴' : 'Remaining (80% limit)'}</div>
                        <div style={{ color: overBudget ? '#ef5350' : '#3fb950', fontSize: '1.3rem', fontWeight: 700 }}>
                            {overBudget ? '-' : ''}₹{Math.abs(remainingBudget).toLocaleString('en-IN')}
                        </div>
                    </div>
                    {/* budget bar */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b949e', marginBottom: 4 }}>
                            <span>Budget usage</span>
                            <span>{income > 0 ? Math.min(100, Math.round((totalSpent / budget80) * 100)) : 0}%</span>
                        </div>
                        <div style={{ background: '#21262d', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 99, transition: 'width 0.6s ease',
                                width: `${income > 0 ? Math.min(100, (totalSpent / budget80) * 100) : 0}%`,
                                background: overBudget ? '#ef5350' : 'linear-gradient(90deg, #3fb95099, #3fb950)'
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Grid ────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* LEFT: Add Expense Form */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.25rem', color: 'white', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} color="#58a6ff" /> Add Expense
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Amount + Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Amount (₹)</label>
                                <input
                                    type="number" step="0.01"
                                    value={form.amount}
                                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                    placeholder="0.00"
                                    style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', colorScheme: 'dark', boxSizing: 'border-box' }}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{CAT[c].emoji} {c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Description (optional)</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="What was this expense for?"
                                style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={addExpense}
                            disabled={!form.amount}
                            style={{
                                width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                                background: !form.amount ? '#21262d' : 'linear-gradient(135deg, #1a6ed8, #58a6ff)',
                                color: !form.amount ? '#8b949e' : 'black',
                                fontWeight: 700, fontSize: '0.95rem', cursor: !form.amount ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={16} /> Add Expense
                        </button>

                        {/* Summary box */}
                        {topCat.length > 0 && (
                            <div style={{ background: '#0e1117', borderRadius: 10, padding: '1rem', marginTop: '0.25rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.78rem', marginBottom: '0.75rem' }}>TOP CATEGORIES</div>
                                {topCat.slice(0, 4).map((c, i) => {
                                    const meta = CAT[c.name] || CAT['Other'];
                                    const pct = totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0;
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ fontSize: '0.9rem' }}>{meta.emoji}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                                                    <span style={{ color: '#c9d1d9' }}>{c.name}</span>
                                                    <span style={{ color: meta.color, fontWeight: 700 }}>₹{c.value.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div style={{ background: '#21262d', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 99 }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Chart + Expense list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Donut chart */}
                    {byCategory.length > 0 && (
                        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                                <div style={{ width: 3, height: 18, background: '#58a6ff', borderRadius: 2 }} />
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>Monthly Breakdown</h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={topCat} innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value">
                                                {topCat.map((entry, i) => (
                                                    <Cell key={i} fill={(CAT[entry.name] || CAT['Other']).color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }}
                                                formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {topCat.slice(0, 5).map((c, i) => {
                                        const meta = CAT[c.name] || CAT['Other'];
                                        const pct = totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0;
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                                                <span style={{ color: '#8b949e', fontSize: '0.78rem', flex: 1 }}>{c.name}</span>
                                                <span style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600 }}>₹{c.value.toLocaleString('en-IN')}</span>
                                                <span style={{ color: meta.color, fontSize: '0.72rem', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expense list */}
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 3, height: 18, background: '#f0b429', borderRadius: 2 }} />
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>Recent Expenses</h3>
                                {expenses.length > 0 && (
                                    <span style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)', padding: '1px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }}>
                                        {expenses.length}
                                    </span>
                                )}
                            </div>
                            {loading && <Loader2 size={14} color="#8b949e" style={{ animation: 'spin 1s linear infinite' }} />}
                        </div>

                        {expenses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8b949e' }}>
                                <TrendingDown size={36} color="#30363d" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                                <p style={{ margin: 0, fontSize: '0.88rem' }}>No expenses logged yet. Add one using the form!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                                {expenses.map(exp => {
                                    const meta = CAT[exp.category] || CAT['Other'];
                                    return (
                                        <div key={exp.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            background: '#0e1117', borderRadius: 10, padding: '10px 12px',
                                            borderLeft: `3px solid ${meta.color}`,
                                            transition: 'opacity 0.2s'
                                        }}>
                                            <div style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30`, borderRadius: 8, padding: '6px 8px', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>
                                                {meta.emoji}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: 'white', fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {exp.description || exp.category}
                                                </div>
                                                <div style={{ color: '#8b949e', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <span style={{ color: meta.color }}>{exp.category}</span>
                                                    {exp.date && (<><span>·</span><Calendar size={9} /><span>{formatDate(exp.date)}</span></>)}
                                                </div>
                                            </div>
                                            <span style={{ color: '#ef5350', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
                                                −₹{exp.amount.toLocaleString('en-IN')}
                                            </span>
                                            <button
                                                onClick={() => deleteExpense(exp.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#30363d', padding: 4, flexShrink: 0 }}
                                                onMouseOver={e => e.currentTarget.style.color = '#f85149'}
                                                onMouseOut={e => e.currentTarget.style.color = '#30363d'}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input:focus, select:focus { border-color: #58a6ff !important; }
                input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
                ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0e1117; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
            `}</style>
        </div>
    );
};

export default Expenses;
