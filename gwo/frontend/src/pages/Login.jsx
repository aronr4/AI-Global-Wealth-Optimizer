import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Zap, Lock, Mail, Loader2 } from 'lucide-react';
import API from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await API.post('/auth/login', { email, password });
            const token = res.data.access_token;
            localStorage.setItem('access_token', token);

            // fetch profile and sync data from MongoDB
            try {
                const me = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const email = me.data?.email || '';
                if (me.data?.name) localStorage.setItem('userName', me.data.name);
                if (email) localStorage.setItem('userEmail', email);

                // Fetch full MongoDB localized state (Income, Risk, Expenses, Goals)
                const syncRes = await API.get('/sync/get_data', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const remoteData = syncRes.data;

                if (remoteData) {
                    if (remoteData.income !== null) localStorage.setItem(`${email}_userIncome`, remoteData.income);
                    if (remoteData.riskProfile) localStorage.setItem(`${email}_riskProfile`, remoteData.riskProfile);
                    if (remoteData.expenses) localStorage.setItem(`${email}_expenses_v2`, JSON.stringify(remoteData.expenses));
                    if (remoteData.savingsGoals) localStorage.setItem(`${email}_savingsGoals_v2`, JSON.stringify(remoteData.savingsGoals));
                }
            } catch (err) {
                console.error("Failed to sync initial user data", err);
            }

            navigate('/app/dashboard');
        } catch (err) {
            console.error('Login Error:', err);
            if (!err.response) {
                setError('Network error: Cannot reach the backend. Check if the server is running.');
            } else if (err.response.status === 500) {
                setError('Internal Server Error: The database might be unreachable.');
            } else {
                setError('Invalid credentials. Please verify your email and password.');
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            background: '#0d1117',
            display: 'flex',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }} className="login-container">

            {/* Left Column: Hero / Logo Section */}
            <div className="login-hero" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '4rem',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.8) 0%, rgba(13, 17, 23, 0.9) 100%)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
                    background: 'radial-gradient(circle, rgba(88, 166, 255, 0.15) 0%, transparent 70%)',
                    filter: 'blur(60px)', zIndex: 0
                }} />

                <div style={{ zIndex: 1, textAlign: 'center' }}>
                    <div style={{
                        width: '120px', height: '120px', borderRadius: '24px', background: 'white',
                        overflow: 'hidden', margin: '0 auto 2rem', boxShadow: '0 16px 32px rgba(0,0,0,0.5)'
                    }} className="flex items-center justify-center">
                        <img src="/logo.png1.jpeg" alt="GWO.AI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{ fontSize: '3rem', color: '#fff', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-1px' }}>
                        GWO<span style={{ color: '#58a6ff' }}>.AI</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#8b949e', maxWidth: '400px', lineHeight: 1.6 }}>
                        Your intelligent wealth optimization platform. Log in to access your portfolio, live deals, and financial insights.
                    </p>
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                zIndex: 1
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '3rem',
                    background: 'rgba(22, 27, 34, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)'
                }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#fff', fontWeight: 700 }}>Welcome Back</h2>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '1rem' }}>Enter your details to access your dashboard.</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '1rem', marginBottom: '1.5rem',
                            background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72',
                            border: '1px solid rgba(248, 81, 73, 0.2)',
                            borderRadius: '12px', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <Shield size={16} /> {error}
                        </div>
                    )}



                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#c9d1d9', fontSize: '0.9rem', fontWeight: 500 }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="#8b949e" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px 16px 14px 44px',
                                        background: 'rgba(13, 17, 23, 0.8)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', outline: 'none',
                                        fontSize: '1rem', transition: 'all 0.2s ease',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#58a6ff'; e.target.style.boxShadow = '0 0 0 3px rgba(88,166,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ color: '#c9d1d9', fontSize: '0.9rem', fontWeight: 500 }}>Password</label>
                                <a href="#" style={{ color: '#58a6ff', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#79c0ff'} onMouseOut={e => e.target.style.color = '#58a6ff'}>Forgot?</a>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="#8b949e" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px 16px 14px 44px',
                                        background: 'rgba(13, 17, 23, 0.8)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', outline: 'none',
                                        fontSize: '1rem', transition: 'all 0.2s ease',
                                        boxSizing: 'border-box', letterSpacing: '2px'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#58a6ff'; e.target.style.boxShadow = '0 0 0 3px rgba(88,166,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '1rem',
                                width: '100%', padding: '14px',
                                background: loading ? '#21262d' : 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                                color: '#fff', border: 'none',
                                borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '1rem', fontWeight: 600,
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s ease',
                                boxShadow: loading ? 'none' : '0 8px 16px rgba(35, 134, 54, 0.2)'
                            }}
                            onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(35, 134, 54, 0.3)'; } }}
                            onMouseOut={e => { if (!loading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(35, 134, 54, 0.2)'; } }}
                        >
                            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={20} />}
                            {loading ? 'Authenticating...' : 'Secure Login'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#8b949e', marginTop: '2.5rem' }}>
                        New to the network?{' '}
                        <Link to="/register" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#79c0ff'} onMouseOut={e => e.target.style.color = '#58a6ff'}>
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 900px) {
                    .login-container { flex-direction: column !important; }
                    .login-hero { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;
