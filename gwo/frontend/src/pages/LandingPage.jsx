import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setValue(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [start, target, duration]);
    return value;
}

// ── Bar chart data ─────────────────────────────────────────────────────────
const marketData = [
    { label: 'India', flag: 'IN', inflation: '5.2%', net: 9.3, color: '#00e5b4', positive: true },
    { label: 'USA', flag: 'US', inflation: '3.4%', net: 6.8, color: '#4fc3f7', positive: true },
    { label: 'EU', flag: 'EU', inflation: '2.8%', net: 5.7, color: '#b0bec5', positive: true },
    { label: 'Gold', flag: '🥇', inflation: '0%', net: 11, color: '#ffd700', positive: true },
    { label: 'Crypto', flag: '₿', inflation: '—', net: 43, color: '#ab47bc', positive: true },
    { label: 'Japan', flag: 'JP', inflation: '3.1%', net: -1.2, color: '#ef5350', positive: false },
];

const features = [
    { icon: '📊', title: 'Interactive Dashboard', desc: 'Visual breakdown of your income, expenses, and savings with real-time financial health scores.' },
    { icon: '⚡', title: 'Live Offers & Deals', desc: 'Real-time discounts and promotions scraped from across the web, tailored to your location and interests.' },
    { icon: '💸', title: 'Expense Tracking', desc: 'Log spending across categories with a visual budget limit and dynamic pie-chart analysis.' },
    { icon: '💼', title: 'Stock Portfolio', desc: 'Track your NSE/BSE stocks with live data and analyze your asset allocation strategy.' },
    { icon: '🤖', title: 'AI Assistant', desc: 'A built-in chat interface powered by GPT to give you personalized financial advice 24/7.' },
    { icon: '⚙️', title: 'Custom Risk Profiles', desc: 'Tailor investment predictions based on your personal risk appetite (Conservative to Aggressive).' },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [heroVisible, setHeroVisible] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef(null);

    const assets = useCounter(50, 1800, statsVisible);
    const users = useCounter(10000, 1800, statsVisible);
    const countries = useCounter(15, 1200, statsVisible);

    useEffect(() => {
        setTimeout(() => setHeroVisible(true), 100);
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.4 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div style={styles.root}>
            {/* ── NAV ───────────────────────────────────────────────────────────── */}
            <nav style={styles.nav}>
                <div style={styles.navLogo}>
                    <img src="/logo.png1.jpeg" alt="GWO Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', background: 'white' }} />
                    <span style={styles.navLogoText}>GWO<span style={styles.navLogoAccent}>.AI</span></span>
                </div>
                <div style={styles.navLinks}>
                    <a href="#features" style={styles.navLink}>Features</a>
                    <a href="#markets" style={styles.navLink}>Markets</a>
                    <a href="#dashboard" style={styles.navLink}>Dashboard</a>
                </div>
                <div style={styles.navActions}>
                    <button onClick={() => navigate('/login')} style={styles.navLoginBtn}>Log In</button>
                    <button onClick={() => navigate('/register')} style={styles.navRegisterBtn}>Sign Up Free</button>
                </div>
            </nav>

            {/* ── HERO ──────────────────────────────────────────────────────────── */}
            <section style={styles.hero}>
                <div style={styles.heroBg} />
                <div style={styles.heroGrid} />
                {/* Glowing orbs */}
                <div style={{ ...styles.orb, ...styles.orb1 }} />
                <div style={{ ...styles.orb, ...styles.orb2 }} />

                <div style={{ ...styles.heroContent, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
                    <div style={styles.heroBadge}>
                        <span style={styles.heroBadgeDot} />
                        AI-Powered Financial Intelligence
                    </div>
                    <h1 style={styles.heroTitle}>
                        AI-Powered<br />
                        <span style={styles.heroTitleGreen}>Global Wealth</span><br />
                        Optimizer
                    </h1>
                    <p style={styles.heroSubtitle}>
                        Track expenses, set visual savings goals, analyze your portfolio, and get personalized AI financial advice to build your wealth intelligently.
                    </p>
                    <div style={styles.heroBtns}>
                        <button onClick={() => navigate('/login')} style={styles.heroCtaBtn}>
                            Get Started Free <span style={{ fontSize: '16px' }}>↗</span>
                        </button>
                        <button onClick={() => navigate('/login')} style={styles.heroSecondaryBtn}>
                            Watch Demo ▶
                        </button>
                    </div>

                    {/* Stats */}
                    <div ref={statsRef} style={styles.heroStats}>
                        <div style={styles.heroStat}>
                            <span style={styles.heroStatNum}>{assets}K+</span>
                            <span style={styles.heroStatLabel}>Expenses Tracked</span>
                        </div>
                        <div style={styles.heroStatDivider} />
                        <div style={styles.heroStat}>
                            <span style={styles.heroStatNum}>{users.toLocaleString()}+</span>
                            <span style={styles.heroStatLabel}>Goals Reached</span>
                        </div>
                        <div style={styles.heroStatDivider} />
                        <div style={styles.heroStat}>
                            <span style={styles.heroStatNum}>{countries}M+</span>
                            <span style={styles.heroStatLabel}>AI Insights</span>
                        </div>
                    </div>

                    {/* Feature pills */}
                    <div style={styles.heroPills}>
                        {['⚡ Online Deals', '💸 Expenses', '📉 Portfolio', '🤖 AI Chat'].map(p => (
                            <span key={p} style={styles.heroPill}>{p}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DASHBOARD PREVIEW ─────────────────────────────────────────────── */}
            <section id="dashboard" style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Your Financial <span style={styles.accentGold}>Dashboard</span></h2>
                    <p style={styles.sectionSub}>Real-time insights into your income, expenses, and investment portfolio.</p>
                </div>
                <div style={styles.dashPreview}>
                    {/* Metric Cards */}
                    <div style={styles.metricsRow}>
                        {[
                            { label: 'Monthly Income', value: '₹1,25,000', change: 'Consistent input', icon: '💼', color: '#00e5b4' },
                            { label: 'Savings Goals', value: '₹25,000', change: '20% of Income', icon: '🎯', color: '#ffd700' },
                            { label: 'Total Expenses', value: '₹62,500', change: '50% Budget Limit', icon: '💸', color: '#ef5350' },
                        ].map(m => (
                            <div key={m.label} style={styles.metricCard}>
                                <div style={styles.metricTop}>
                                    <span style={styles.metricLabel}>{m.label}</span>
                                    <span style={{ ...styles.metricIcon, color: m.color }}>{m.icon}</span>
                                </div>
                                <div style={{ ...styles.metricValue, color: m.color }}>{m.value}</div>
                                <div style={styles.metricChange}>{m.change}</div>
                            </div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div style={styles.chartsRow}>
                        {/* Income vs Expenses fake chart */}
                        <div style={styles.chartCard}>
                            <div style={styles.chartTitle}>Income vs Expenses</div>
                            <svg viewBox="0 0 400 160" style={{ width: '100%', height: '160px' }}>
                                <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00e5b4" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#00e5b4" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ffd700" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* grid lines */}
                                {[30, 60, 90, 120].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#ffffff10" strokeWidth="1" />)}
                                {/* Income area */}
                                <path d="M0,100 C50,90 100,70 150,65 C200,60 250,50 300,40 C350,30 375,20 400,15" fill="none" stroke="#00e5b4" strokeWidth="2.5" />
                                <path d="M0,100 C50,90 100,70 150,65 C200,60 250,50 300,40 C350,30 375,20 400,15 L400,160 L0,160 Z" fill="url(#incomeGrad)" />
                                {/* Expense area */}
                                <path d="M0,115 C50,118 100,125 150,120 C200,115 250,118 300,112 C350,108 375,110 400,105" fill="none" stroke="#ffd700" strokeWidth="2.5" />
                                <path d="M0,115 C50,118 100,125 150,120 C200,115 250,118 300,112 C350,108 375,110 400,105 L400,160 L0,160 Z" fill="url(#expenseGrad)" />
                                {/* X labels */}
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                                    <text key={m} x={i * 80 + 10} y="155" fill="#888" fontSize="10">{m}</text>
                                ))}
                            </svg>
                        </div>

                        {/* Portfolio Allocation donut */}
                        <div style={styles.chartCard}>
                            <div style={styles.chartTitle}>Portfolio Allocation</div>
                            <div style={styles.donutWrapper}>
                                <svg viewBox="0 0 120 120" width="110" height="110">
                                    {/* donut segments */}
                                    {[
                                        { pct: 50, color: '#ef5350', offset: 0 },
                                        { pct: 30, color: '#00e5b4', offset: 50 },
                                        { pct: 20, color: '#ffd700', offset: 80 },
                                    ].map(({ pct, color, offset }, i) => {
                                        const r = 45, cx = 60, cy = 60;
                                        const circ = 2 * Math.PI * r;
                                        const dash = (pct / 100) * circ;
                                        const gap = circ - dash;
                                        const rot = (offset / 100) * 360 - 90;
                                        return (
                                            <circle key={i} cx={cx} cy={cy} r={r}
                                                fill="none" stroke={color} strokeWidth="18"
                                                strokeDasharray={`${dash} ${gap}`}
                                                transform={`rotate(${rot} ${cx} ${cy})`}
                                                style={{ transition: 'stroke-dasharray 1s ease' }}
                                            />
                                        );
                                    })}
                                    <circle cx="60" cy="60" r="28" fill="#1a1f2e" />
                                </svg>
                                <div style={styles.donutLegend}>
                                    {[
                                        { label: 'Expenses (50%)', pct: '₹62,500', color: '#ef5350' },
                                        { label: 'Investment (30%)', pct: '₹37,500', color: '#00e5b4' },
                                        { label: 'Savings (20%)', pct: '₹25,000', color: '#ffd700' },
                                    ].map(l => (
                                        <div key={l.label} style={styles.legendRow}>
                                            <span style={{ ...styles.legendDot, background: l.color }} />
                                            <span style={styles.legendLabel}>{l.label}</span>
                                            <span style={styles.legendPct}>{l.pct}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────────────────── */}
            <section id="features" style={{ ...styles.section, background: '#0d1117' }}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Intelligent <span style={styles.accentGreen}>Features</span></h2>
                    <p style={styles.sectionSub}>Everything works together in a seamless ecosystem where your data empowers the AI.</p>
                </div>
                <div style={styles.featuresGrid}>
                    <div style={styles.featureCard} className="feature-card">
                        <div style={styles.featureIcon}>🤖</div>
                        <div style={styles.featureTitle}>AI Assistant (RAG & MCP)</div>
                        <div style={styles.featureDesc}><b>RAG</b> pulls real-time market data to prevent hallucinations, while <b>MCP</b> securely connects the AI to your live portfolio and expense data for 100% personalized advice.</div>
                    </div>
                    {features.filter(f => f.title !== 'AI Assistant').map(f => (
                        <div key={f.title} style={styles.featureCard} className="feature-card">
                            <div style={styles.featureIcon}>{f.icon}</div>
                            <div style={styles.featureTitle}>{f.title}</div>
                            <div style={styles.featureDesc}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── REAL APP FEATURES SHOWCASE ──────────────────────────────────────── */}
            <section id="markets" style={styles.section}>
                <div style={styles.sectionBadge}>⚙️ Core Capabilities</div>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Everything You Need to <span style={styles.accentGold}>Succeed</span></h2>
                    <p style={styles.sectionSub}>A complete suite of tools designed to track, manage, and grow your wealth automatically.</p>
                </div>
                <div style={styles.marketsLayout}>
                    {/* Visual Showcase - Savings Goals */}
                    <div style={styles.barChartCard}>
                        <div style={{ ...styles.chartTitle, color: '#00e5b4' }}>🎯 Smart Savings Goals</div>
                        <p style={{ color: '#9ba3bc', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
                            Visualize your dreams. Set target amounts and dates for your car, house, or vacation. Our AI instantly predicts the monthly yield required to hit your exact timeline.
                        </p>
                        <div style={{ background: '#1a2035', padding: '16px', borderRadius: '12px', borderLeft: '3px solid #00e5b4' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Dream House Downpayment</span>
                                <span style={{ color: '#00e5b4', fontSize: '14px', fontWeight: 700 }}>80%</span>
                            </div>
                            <div style={styles.barTrack}>
                                <div style={{ ...styles.barFill, width: '80%', background: '#00e5b4', boxShadow: '0 0 10px #00e5b455' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#778' }}>
                                <span>₹8,00,000 saved</span>
                                <span>Goal: ₹10,00,000</span>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div style={styles.marketCards}>
                        <div style={styles.marketCard}>
                            <div style={styles.marketFlag}>💸</div>
                            <div style={styles.marketInfo}>
                                <div style={styles.marketName}>Expense Logging</div>
                                <div style={styles.marketInflation}>Track spending by category (Food, Travel, etc.)</div>
                            </div>
                            <div style={{ ...styles.marketNet, color: '#ef5350', fontSize: '14px' }}>
                                -₹45K<div style={styles.marketNetLabel}>This Month</div>
                            </div>
                        </div>
                        <div style={styles.marketCard}>
                            <div style={styles.marketFlag}>📈</div>
                            <div style={styles.marketInfo}>
                                <div style={styles.marketName}>Stock Portfolio</div>
                                <div style={styles.marketInflation}>Real-time Indian stock tracking (NSE/BSE)</div>
                            </div>
                            <div style={{ ...styles.marketNet, color: '#00e5b4', fontSize: '14px' }}>
                                +12.4%<div style={styles.marketNetLabel}>Returns</div>
                            </div>
                        </div>
                        <div style={styles.marketCard}>
                            <div style={styles.marketFlag}>⚡</div>
                            <div style={styles.marketInfo}>
                                <div style={styles.marketName}>Live Offers & Online Deals</div>
                                <div style={styles.marketInflation}>Real-time deals scraped from across the web</div>
                            </div>
                            <div style={{ ...styles.marketNet, color: '#f0b429', fontSize: '14px' }}>
                                Active<div style={styles.marketNetLabel}>Now</div>
                            </div>
                        </div>
                        <div style={styles.marketCard}>
                            <div style={styles.marketFlag}>🤖</div>
                            <div style={styles.marketInfo}>
                                <div style={styles.marketName}>AI Financial Chat</div>
                                <div style={styles.marketInflation}>Ask questions, get personalized advice instantly</div>
                            </div>
                            <div style={{ ...styles.marketNet, color: '#4fc3f7', fontSize: '14px' }}>
                                24/7<div style={styles.marketNetLabel}>Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────────────── */}
            <section style={styles.ctaSection}>
                <div style={styles.ctaBg} />
                <div style={styles.ctaContent}>
                    <h2 style={styles.ctaTitle}>
                        Ready to <span style={styles.accentGreen}>Optimize</span> Your<br />Wealth?
                    </h2>
                    <p style={styles.ctaSubtitle}>
                        Join thousands of users who trust GWO.AI for personalized financial advice powered by cutting-edge AI technology.
                    </p>
                    <div style={styles.ctaBtns}>
                        <button onClick={() => navigate('/register')} style={styles.heroCtaBtn}>
                            Get Started Free →
                        </button>
                        <button onClick={() => navigate('/login')} style={styles.heroSecondaryBtn}>
                            ⬇ Download Report
                        </button>
                    </div>
                    <p style={styles.ctaDisclaimer}>No credit card required · Free tier available · Cancel anytime</p>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────────────────────── */}
            <footer style={styles.footer}>
                <div style={styles.footerTop}>
                    <div style={styles.footerBrand}>
                        <div style={styles.navLogo}>
                            <img src="/logo.png1.jpeg" alt="GWO Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', background: 'white' }} />
                            <span style={styles.navLogoText}>GWO<span style={styles.navLogoAccent}>.AI</span></span>
                        </div>
                        <p style={styles.footerBrandDesc}>AI-powered global wealth optimizer using RAG and MCP architecture for personalized financial advice.</p>
                        <div style={styles.footerSocials}>
                            {['🖥', '🐦', '💼', '✉'].map(s => (
                                <span key={s} style={styles.socialIcon}>{s}</span>
                            ))}
                        </div>
                    </div>
                    {[
                        { title: 'Product', items: ['Features', 'Dashboard', 'AI Assistant', 'Pricing'] },
                        { title: 'Resources', items: ['Documentation', 'API Reference', 'Blog', 'Tutorials'] },
                        { title: 'Company', items: ['About Us', 'Careers', 'Contact', 'Press'] },
                        { title: 'Legal', items: ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance'] },
                    ].map(col => (
                        <div key={col.title} style={styles.footerCol}>
                            <div style={styles.footerColTitle}>{col.title}</div>
                            {col.items.map(item => (
                                <div key={item} style={styles.footerColItem}>{item}</div>
                            ))}
                        </div>
                    ))}
                </div>
                <div style={styles.footerBottom}>
                    <span>© 2025 GWO.AI · All rights reserved</span>
                    <span style={{ color: '#00e5b4' }}>Built with ❤️ for smarter investing</span>
                </div>
            </footer>

            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .feature-card:hover {
          transform: translateY(-6px) !important;
          border-color: #00e5b455 !important;
          background: #1e2535 !important;
        }
      `}</style>
        </div>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
    root: { background: '#0a0e1a', color: '#e8eaf0', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', overflowX: 'hidden' },

    // NAV
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #ffffff10' },
    navLogo: { display: 'flex', alignItems: 'center', gap: '8px' },
    navLogoIcon: { fontSize: '22px', color: '#00e5b4' },
    navLogoText: { fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' },
    navLogoAccent: { color: '#00e5b4' },
    navLinks: { display: 'flex', gap: '32px' },
    navLink: { color: '#aab', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' },
    navActions: { display: 'flex', gap: '12px' },
    navLoginBtn: { background: 'transparent', border: '1px solid #ffffff30', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
    navRegisterBtn: { background: 'linear-gradient(135deg, #00e5b4, #00b894)', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },

    // HERO
    hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', paddingTop: '80px' },
    heroBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #00e5b415 0%, transparent 70%)', pointerEvents: 'none' },
    heroGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' },
    orb: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' },
    orb1: { width: '500px', height: '500px', background: '#00e5b408', top: '-100px', left: '-100px' },
    orb2: { width: '400px', height: '400px', background: '#1a237e20', bottom: '-50px', right: '-50px' },
    heroContent: { position: 'relative', zIndex: 2, maxWidth: '760px', padding: '0 24px' },
    heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#00e5b415', border: '1px solid #00e5b430', color: '#00e5b4', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, marginBottom: '28px' },
    heroBadgeDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#00e5b4', boxShadow: '0 0 8px #00e5b4', animation: 'pulse 2s infinite', display: 'inline-block' },
    heroTitle: { fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', color: '#fff', letterSpacing: '-2px' },
    heroTitleGreen: { color: '#00e5b4' },
    heroSubtitle: { fontSize: '16px', color: '#9ba3bc', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto 36px' },
    heroBtns: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' },
    heroCtaBtn: { background: 'linear-gradient(135deg, #00e5b4, #00b894)', border: 'none', color: '#000', padding: '14px 32px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 30px #00e5b440', transition: 'transform 0.2s, box-shadow 0.2s' },
    heroSecondaryBtn: { background: 'transparent', border: '1px solid #ffffff30', color: '#fff', padding: '14px 32px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 },
    heroStats: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginBottom: '32px' },
    heroStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    heroStatNum: { fontSize: '24px', fontWeight: 800, color: '#00e5b4' },
    heroStatLabel: { fontSize: '11px', color: '#778', marginTop: '2px' },
    heroStatDivider: { width: '1px', height: '36px', background: '#ffffff15' },
    heroPills: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' },
    heroPill: { background: '#1a2035', border: '1px solid #ffffff15', color: '#aab', padding: '6px 14px', borderRadius: '20px', fontSize: '12px' },

    // SECTIONS
    section: { padding: '100px 48px', maxWidth: '1200px', margin: '0 auto' },
    sectionBadge: { textAlign: 'center', marginBottom: '16px', background: '#00e5b415', border: '1px solid #00e5b430', color: '#00e5b4', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', display: 'inline-block', position: 'relative', left: '50%', transform: 'translateX(-50%)' },
    sectionHeader: { textAlign: 'center', marginBottom: '60px' },
    sectionTitle: { fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', marginBottom: '14px', letterSpacing: '-1px' },
    sectionSub: { color: '#778', fontSize: '15px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 },
    accentGold: { color: '#ffd700' },
    accentGreen: { color: '#00e5b4' },

    // DASHBOARD PREVIEW
    dashPreview: { background: '#111827', borderRadius: '20px', padding: '32px', border: '1px solid #ffffff10', boxShadow: '0 0 60px #00000060' },
    metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' },
    metricCard: { background: '#1a2035', borderRadius: '14px', padding: '22px', border: '1px solid #ffffff0d' },
    metricTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    metricLabel: { color: '#778', fontSize: '12px', fontWeight: 500 },
    metricIcon: { fontSize: '20px' },
    metricValue: { fontSize: '26px', fontWeight: 800, marginBottom: '8px' },
    metricChange: { color: '#00e5b4', fontSize: '12px' },
    chartsRow: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' },
    chartCard: { background: '#1a2035', borderRadius: '14px', padding: '22px', border: '1px solid #ffffff0d' },
    chartTitle: { color: '#aab', fontSize: '13px', fontWeight: 600, marginBottom: '16px' },
    donutWrapper: { display: 'flex', alignItems: 'center', gap: '24px' },
    donutLegend: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    legendRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    legendDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
    legendLabel: { fontSize: '12px', color: '#aab', flex: 1 },
    legendPct: { fontSize: '12px', color: '#fff', fontWeight: 600 },

    // FEATURES
    featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
    featureCard: { background: '#111827', borderRadius: '16px', padding: '28px', border: '1px solid #ffffff0d', cursor: 'default', transition: 'all 0.3s ease' },
    featureIcon: { fontSize: '28px', marginBottom: '16px' },
    featureTitle: { fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '10px' },
    featureDesc: { fontSize: '13px', color: '#778', lineHeight: 1.6 },

    // MARKETS
    marketsLayout: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' },
    barChartCard: { background: '#111827', borderRadius: '16px', padding: '28px', border: '1px solid #ffffff0d' },
    barChart: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' },
    barRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    barLabel: { color: '#778', fontSize: '12px', width: '44px', flexShrink: 0 },
    barTrack: { flex: 1, background: '#ffffff0a', borderRadius: '4px', height: '10px', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: '4px', transition: 'width 1.2s ease' },
    barValue: { fontSize: '12px', fontWeight: 600, width: '44px', textAlign: 'right', flexShrink: 0 },
    marketCards: { display: 'flex', flexDirection: 'column', gap: '12px' },
    marketCard: { background: '#111827', borderRadius: '12px', padding: '16px 20px', border: '1px solid #ffffff0d', display: 'flex', alignItems: 'center', gap: '14px' },
    marketFlag: { width: '36px', height: '36px', background: '#1a2035', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#aab' },
    marketInfo: { flex: 1 },
    marketName: { fontWeight: 700, color: '#fff', fontSize: '14px' },
    marketInflation: { color: '#778', fontSize: '11px', marginTop: '2px' },
    marketNet: { fontWeight: 800, fontSize: '16px', textAlign: 'right' },
    marketNetLabel: { fontSize: '10px', color: '#778', fontWeight: 400 },
    viewAllLink: { color: '#00e5b4', fontSize: '13px', cursor: 'pointer', paddingLeft: '4px', textDecoration: 'underline', textDecorationColor: '#00e5b440' },

    // CTA
    ctaSection: { position: 'relative', padding: '120px 48px', textAlign: 'center', overflow: 'hidden' },
    ctaBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 50%, #00e5b410 0%, transparent 70%)', pointerEvents: 'none' },
    ctaContent: { position: 'relative', zIndex: 1 },
    ctaTitle: { fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#fff', marginBottom: '20px', lineHeight: 1.15, letterSpacing: '-1.5px' },
    ctaSubtitle: { color: '#778', fontSize: '15px', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.6 },
    ctaBtns: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' },
    ctaDisclaimer: { color: '#556', fontSize: '12px' },

    // FOOTER
    footer: { background: '#050810', borderTop: '1px solid #ffffff0a', padding: '60px 48px 30px' },
    footerTop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '40px', marginBottom: '50px' },
    footerBrand: { display: 'flex', flexDirection: 'column', gap: '12px' },
    footerBrandDesc: { color: '#556', fontSize: '13px', lineHeight: 1.6, maxWidth: '220px' },
    footerSocials: { display: 'flex', gap: '10px', marginTop: '8px' },
    socialIcon: { width: '34px', height: '34px', background: '#1a2035', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' },
    footerCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
    footerColTitle: { color: '#fff', fontWeight: 700, fontSize: '13px', marginBottom: '4px' },
    footerColItem: { color: '#556', fontSize: '13px', cursor: 'pointer', transition: 'color 0.2s' },
    footerBottom: { borderTop: '1px solid #ffffff08', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#445', fontSize: '12px' },
};
