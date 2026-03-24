import React, { useState, useEffect } from 'react';
import {
    Target, Zap, Plus, Trash2, TrendingUp, Calendar,
    Home, Car, Plane, GraduationCap, Heart, Briefcase,
    ShieldCheck, Star, Loader2
} from 'lucide-react';
import API from '../api';

// ── Icon map ───────────────────────────────────────────────────────────────
const ICONS = {
    Target: { Icon: Target, emoji: '🎯' },
    Home: { Icon: Home, emoji: '🏠' },
    Car: { Icon: Car, emoji: '🚗' },
    Travel: { Icon: Plane, emoji: '✈️' },
    Education: { Icon: GraduationCap, emoji: '🎓' },
    Wedding: { Icon: Heart, emoji: '💍' },
    Business: { Icon: Briefcase, emoji: '💼' },
    Emergency: { Icon: ShieldCheck, emoji: '🛡️' },
    Retirement: { Icon: Star, emoji: '⭐' },
};

const COLORS = {
    Green: { main: '#00e5b4', bg: 'rgba(0,229,180,0.12)', border: 'rgba(0,229,180,0.35)' },
    Blue: { main: '#58a6ff', bg: 'rgba(88,166,255,0.12)', border: 'rgba(88,166,255,0.35)' },
    Purple: { main: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
    Gold: { main: '#f0b429', bg: 'rgba(240,180,41,0.12)', border: 'rgba(240,180,41,0.35)' },
    Red: { main: '#ef5350', bg: 'rgba(239,83,80,0.12)', border: 'rgba(239,83,80,0.35)' },
    Pink: { main: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.35)' },
};

const BASE_STORAGE_KEY = 'savingsGoals_v2';

const defaultForm = { name: '', target: '', current: '', date: '', icon: 'Target', color: 'Green' };

const SavingsGoals = () => {
    const userEmail = localStorage.getItem('userEmail') || 'guest';
    const STORAGE_KEY = `${userEmail}_${BASE_STORAGE_KEY}`;

    // ── read income from Dashboard ──────────────────────────────────────────
    const income = Number(localStorage.getItem(`${userEmail}_userIncome`) || 0);
    const riskProfile = localStorage.getItem(`${userEmail}_riskProfile`) || 'medium';
    const investBudget = income ? Math.round(income * 0.3) : 0;

    // ── state ───────────────────────────────────────────────────────────────
    const [goals, setGoals] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    });
    const [form, setForm] = useState(defaultForm);
    const [aiTip, setAiTip] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const [synced, setSynced] = useState(true);

    // persist goals
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
        API.post('/sync/save_data', { savingsGoals: goals }).then(() => setSynced(true)).catch(() => setSynced(false));
    }, [goals]);

    // fetch AI tip on mount
    useEffect(() => {
        if (!income) return;
        setAiLoading(true);
        API.post('/ai/recommend', { savings_budget: investBudget, risk_profile: riskProfile })
            .then(r => setAiTip(r.data?.model_predictions?.expected_yield_percentage?.toFixed(1) || null))
            .catch(() => { })
            .finally(() => setAiLoading(false));
    }, []);

    // ── helpers ─────────────────────────────────────────────────────────────
    const addGoal = () => {
        if (!form.name || !form.target) return;
        const goal = {
            id: Date.now(),
            name: form.name,
            target: Number(form.target),
            current: Number(form.current) || 0,
            date: form.date,
            icon: form.icon,
            color: form.color,
        };
        setGoals(prev => [goal, ...prev]);
        setForm(defaultForm);
    };

    const deleteGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id));

    const addToGoal = (id, amount) => {
        setGoals(prev => prev.map(g => g.id === id
            ? { ...g, current: Math.min(g.target, g.current + amount) }
            : g
        ));
    };

    const pct = (g) => Math.min(100, Math.round((g.current / g.target) * 100));

    const monthsLeft = (dateStr) => {
        if (!dateStr) return null;
        const diff = new Date(dateStr) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)));
    };

    const monthlySave = (g) => {
        const ml = monthsLeft(g.date);
        if (!ml) return null;
        const remaining = g.target - g.current;
        return remaining > 0 ? Math.ceil(remaining / ml) : 0;
    };

    return (
        <div style={{ paddingBottom: '3rem', color: '#c9d1d9', width: '100%' }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.4rem' }}>
                <Target size={24} color="#f0b429" />
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>Savings Goals</h1>
                <span style={{ background: synced ? 'rgba(240,180,41,0.15)' : 'rgba(139,148,158,0.15)', color: synced ? '#f0b429' : '#8b949e', border: `1px solid ${synced ? 'rgba(240,180,41,0.3)' : 'rgba(139,148,158,0.3)'}`, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                    {synced ? '● Synced' : '○ Local'}
                </span>
            </div>
            <p style={{ margin: '0 0 1.5rem', color: '#8b949e', fontSize: '0.88rem' }}>
                Set, track, and achieve your financial goals. Your 30% investment budget is automatically factored in.
            </p>

            {/* ── Income + Savings Banner ────────────────────────────────── */}
            {income > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
                    background: 'linear-gradient(135deg, rgba(88,166,255,0.07) 0%, rgba(63,185,80,0.07) 100%)',
                    border: '1px solid rgba(88,166,255,0.18)', borderRadius: 14, padding: '1rem 1.5rem',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <div style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Income</div>
                        <div style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>₹{income.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <div style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Save 20% to Fulfill Your Dreams 🌟</div>
                        <div style={{ color: '#00e5b4', fontSize: '1.3rem', fontWeight: 700 }}>₹{Math.round(income * 0.2).toLocaleString('en-IN')}<span style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: 400 }}>/mo</span></div>
                    </div>
                </div>
            )}

            {/* ── Main Grid ────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* LEFT: Create Goal Form */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.25rem', color: 'white', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} color="#00e5b4" /> Create Savings Goal
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Goal Name */}
                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Goal Name</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g., Emergency Fund"
                                style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Target + Current */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Target (₹)</label>
                                <input
                                    type="number"
                                    value={form.target}
                                    onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                                    placeholder="100000"
                                    style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Current (₹)</label>
                                <input
                                    type="number"
                                    value={form.current}
                                    onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
                                    placeholder="0"
                                    style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* Target Date */}
                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Target Date (optional)</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Icon + Color */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Icon</label>
                                <select
                                    value={form.icon}
                                    onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                    style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', colorScheme: 'dark', boxSizing: 'border-box' }}
                                >
                                    {Object.entries(ICONS).map(([k, v]) => (
                                        <option key={k} value={k}>{v.emoji} {k}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.82rem', marginBottom: 6 }}>Color</label>
                                <select
                                    value={form.color}
                                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                                    style={{ width: '100%', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', colorScheme: 'dark', boxSizing: 'border-box' }}
                                >
                                    {Object.keys(COLORS).map(c => (
                                        <option key={c} value={c}>● {c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Create Button */}
                        <button
                            onClick={addGoal}
                            disabled={!form.name || !form.target}
                            style={{
                                width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                                background: (!form.name || !form.target) ? '#21262d' : 'linear-gradient(135deg, #2ea043, #00e5b4)',
                                color: (!form.name || !form.target) ? '#8b949e' : 'black',
                                fontWeight: 700, fontSize: '0.95rem', cursor: (!form.name || !form.target) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={16} /> Create Goal
                        </button>

                        {/* Summary */}
                        {goals.length > 0 && (
                            <div style={{ background: '#0e1117', borderRadius: 10, padding: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.78rem', marginBottom: '0.5rem' }}>GOALS SUMMARY</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                    <span style={{ color: '#8b949e' }}>Total Goals</span>
                                    <span style={{ color: 'white', fontWeight: 700 }}>{goals.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: 4 }}>
                                    <span style={{ color: '#8b949e' }}>Total Target</span>
                                    <span style={{ color: '#f0b429', fontWeight: 700 }}>₹{goals.reduce((a, g) => a + g.target, 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: 4 }}>
                                    <span style={{ color: '#8b949e' }}>Total Saved</span>
                                    <span style={{ color: '#00e5b4', fontWeight: 700 }}>₹{goals.reduce((a, g) => a + g.current, 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Goal Cards */}
                <div>
                    {goals.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', background: '#161b22', border: '1px solid #30363d', borderRadius: 14, gap: 16 }}>
                            <Target size={48} color="#30363d" />
                            <h3 style={{ color: '#8b949e', fontWeight: 400, margin: 0 }}>No goals yet</h3>
                            <p style={{ color: '#30363d', fontSize: '0.85rem', margin: 0 }}>Create your first savings goal using the form on the left.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {goals.map(g => {
                                const progress = pct(g);
                                const done = progress >= 100;
                                const clr = COLORS[g.color] || COLORS.Green;
                                const iconData = ICONS[g.icon] || ICONS.Target;
                                const ml = monthsLeft(g.date);
                                const ms = monthlySave(g);

                                return (
                                    <div key={g.id} style={{
                                        background: '#161b22', border: `1px solid ${done ? clr.border : '#30363d'}`,
                                        borderRadius: 14, padding: '1.25rem', position: 'relative',
                                        boxShadow: done ? `0 0 20px ${clr.bg}` : 'none',
                                        transition: 'box-shadow 0.3s'
                                    }}>
                                        {done && (
                                            <div style={{ position: 'absolute', top: -10, right: 14, background: clr.main, color: '#000', padding: '2px 10px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 800 }}>
                                                ✅ GOAL REACHED
                                            </div>
                                        )}

                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                                            <div style={{ background: clr.bg, border: `1px solid ${clr.border}`, borderRadius: 10, padding: 8, fontSize: '1.2rem', lineHeight: 1 }}>
                                                {iconData.emoji}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{g.name}</div>
                                                {g.date && (
                                                    <div style={{ color: '#8b949e', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Calendar size={10} /> {new Date(g.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#30363d', padding: 4 }}
                                                onMouseOver={e => e.currentTarget.style.color = '#f85149'}
                                                onMouseOut={e => e.currentTarget.style.color = '#30363d'}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Amount */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: clr.main, fontWeight: 700, fontSize: '1.1rem' }}>₹{g.current.toLocaleString('en-IN')}</span>
                                            <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>of ₹{g.target.toLocaleString('en-IN')}</span>
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{ background: '#21262d', borderRadius: 99, height: 8, marginBottom: '0.75rem', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 99,
                                                width: `${progress}%`,
                                                background: `linear-gradient(90deg, ${clr.main}99, ${clr.main})`,
                                                transition: 'width 0.6s ease'
                                            }} />
                                        </div>

                                        {/* Stats row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.85rem' }}>
                                            <span>{progress}% complete</span>
                                            {ml !== null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> {ml} months left</span>}
                                        </div>

                                        {/* Monthly save tip */}
                                        {ms !== null && !done && (
                                            <div style={{ background: '#0e1117', borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>Save monthly</span>
                                                <span style={{ color: clr.main, fontWeight: 700, fontSize: '0.82rem' }}>₹{ms.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}

                                        {/* Add funds */}
                                        {!done && investBudget > 0 && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {[Math.round(investBudget * 0.25), Math.round(investBudget * 0.5), investBudget].map((amt, i) => (
                                                    <button key={i} onClick={() => addToGoal(g.id, amt)} style={{
                                                        flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${clr.border}`,
                                                        background: 'transparent', color: clr.main, fontSize: '0.72rem', fontWeight: 600,
                                                        cursor: 'pointer', transition: 'background 0.2s'
                                                    }}
                                                        onMouseOver={e => e.currentTarget.style.background = clr.bg}
                                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        +₹{amt.toLocaleString('en-IN')}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                input:focus, select:focus { border-color: #58a6ff !important; }
                input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
            `}</style>
        </div>
    );
};

export default SavingsGoals;
