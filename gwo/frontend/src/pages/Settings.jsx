import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Key, Mail, Calendar, Shield, Loader2, Pencil, Check, X, Clock, TrendingUp } from 'lucide-react';
import API from '../api';

const Settings = () => {
    const navigate = useNavigate();

    // read from localStorage immediately so data shows without any loading flash
    const [user, setUser] = useState(() => ({
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
    }));
    const [loading, setLoading] = useState(!localStorage.getItem('userName'));
    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState(localStorage.getItem('userName') || '');

    // ── read local prefs ─────────────────────────────────────────────────
    const income = Number(localStorage.getItem(`${user.email}_userIncome`) || 0);
    const riskProfile = localStorage.getItem(`${user.email}_riskProfile`) || 'medium';
    const goals = (() => { try { return JSON.parse(localStorage.getItem(`${user.email}_savingsGoals_v2`) || '[]'); } catch { return []; } })();
    const expenses = (() => { try { return JSON.parse(localStorage.getItem(`${user.email}_expenses_v2`) || '[]'); } catch { return []; } })();

    // silent background refresh from API
    useEffect(() => {
        API.get('/auth/me')
            .then(r => {
                if (r.data?.name) { localStorage.setItem('userName', r.data.name); }
                if (r.data?.email) { localStorage.setItem('userEmail', r.data.email); }
                setUser({ name: r.data?.name || '', email: r.data?.email || '' });
                setNameInput(r.data?.name || '');
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleSignOut = () => {
        // Clear all local storage so data isn't exposed to the next logged out user
        const keys = Object.keys(localStorage);
        for (let k of keys) {
            localStorage.removeItem(k);
        }
        navigate('/');
    };

    const riskColor = riskProfile === 'high' ? '#ef5350' : riskProfile === 'medium' ? '#ffd700' : '#00e5b4';
    const riskEmoji = riskProfile === 'high' ? '🔴' : riskProfile === 'medium' ? '🟡' : '🟢';

    const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

    return (
        <div style={{ paddingBottom: '3rem', color: '#c9d1d9', width: '100%' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.4rem' }}>
                <User size={24} color="#a78bfa" />
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>Profile & Settings</h1>
            </div>
            <p style={{ margin: '0 0 1.75rem', color: '#8b949e', fontSize: '0.88rem' }}>
                Manage your account, view your profile details, and sign out.
            </p>

            {/* ── Profile Card ─────────────────────────────────────────────*/}
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                    <div style={{ width: 3, height: 20, background: '#a78bfa', borderRadius: 2 }} />
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Account Information</h3>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8b949e' }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading profile…
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Avatar */}
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #58a6ff, #a78bfa)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.8rem', fontWeight: 800, color: 'white',
                            border: '3px solid rgba(167,139,250,0.3)'
                        }}>
                            {initials}
                        </div>

                        {/* Details — vertical */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                            {/* Name */}
                            <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <User size={11} /> Full Name
                                </div>
                                {editing ? (
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <input
                                            autoFocus
                                            value={nameInput}
                                            onChange={e => setNameInput(e.target.value)}
                                            style={{ background: '#161b22', border: '1px solid #58a6ff', borderRadius: 6, padding: '4px 8px', color: 'white', fontSize: '0.9rem', outline: 'none', flex: 1 }}
                                        />
                                        <button onClick={() => {
                                            setUser(u => ({ ...u, name: nameInput }));
                                            localStorage.setItem('userName', nameInput);
                                            window.dispatchEvent(new Event('profileUpdated'));
                                            setEditing(false);
                                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3fb950' }}><Check size={14} /></button>
                                        <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef5350' }}><X size={14} /></button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || '—'}</span>
                                        <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: 0 }}><Pencil size={12} /></button>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Mail size={11} /> Email Address
                                </div>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{user?.email || '—'}</span>
                            </div>

                            {/* Account type */}
                            <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Shield size={11} /> Account Type
                                </div>
                                <span style={{ color: '#f0b429', fontWeight: 600, fontSize: '0.95rem' }}>
                                    {user?.is_google ? '🔵 Google Account' : '🔑 Email & Password'}
                                </span>
                            </div>

                            {/* Member since */}
                            <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Calendar size={11} /> Member Since
                                </div>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                                    {user?.created_at
                                        ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'March 2026'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── App Data Overview ─────────────────────────────────────────*/}
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                    <div style={{ width: 3, height: 20, background: '#58a6ff', borderRadius: 2 }} />
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Your Financial Data</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem', borderLeft: '3px solid #58a6ff' }}>
                        <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>Monthly Income</div>
                        <div style={{ color: '#58a6ff', fontSize: '1.2rem', fontWeight: 700 }}>
                            {income > 0 ? `₹${income.toLocaleString('en-IN')}` : <span style={{ color: '#30363d' }}>Not set</span>}
                        </div>
                    </div>

                    <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem', borderLeft: `3px solid ${riskColor}` }}>
                        <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>Risk Profile</div>
                        <div style={{ color: riskColor, fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {riskEmoji} {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
                        </div>
                    </div>

                    <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem', borderLeft: '3px solid #00e5b4' }}>
                        <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>Active Goals</div>
                        <div style={{ color: '#00e5b4', fontSize: '1.2rem', fontWeight: 700 }}>
                            {goals.length} goal{goals.length !== 1 ? 's' : ''}
                        </div>
                        {goals.length > 0 && (
                            <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>
                                ₹{goals.reduce((s, g) => s + g.current, 0).toLocaleString('en-IN')} saved
                            </div>
                        )}
                    </div>

                    <div style={{ background: '#0e1117', borderRadius: 10, padding: '0.9rem 1rem', borderLeft: '3px solid #ef5350' }}>
                        <div style={{ color: '#8b949e', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>Expenses Logged</div>
                        <div style={{ color: '#ef5350', fontSize: '1.2rem', fontWeight: 700 }}>
                            {expenses.length} entries
                        </div>
                        {expenses.length > 0 && (
                            <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>
                                ₹{expenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')} total
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Account Actions ───────────────────────────────────────────*/}
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                    <div style={{ width: 3, height: 20, background: '#ef5350', borderRadius: 2 }} />
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Account Actions</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => alert('Broker API integration coming soon!')}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0e1117', border: '1px solid #30363d', borderRadius: 8, color: '#c9d1d9', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                    >
                        <Key size={14} /> Link Broker API
                    </button>
                    <button
                        onClick={handleSignOut}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.35)', borderRadius: 8, color: '#ef5350', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Settings;
