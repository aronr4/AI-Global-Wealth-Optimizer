import React, { useState, useEffect, useCallback } from 'react';
import {
    Zap, ExternalLink, RefreshCw, Loader2, ShoppingBag,
    Utensils, Smartphone, Plane, Sparkles, CreditCard, Wifi,
    Tag, ChevronRight, Flame
} from 'lucide-react';
import API from '../api';

const CAT_META = {
    fashion:     { icon: ShoppingBag, color: '#ec4899', label: 'Fashion' },
    food:        { icon: Utensils,    color: '#f97316', label: 'Food & Groceries' },
    electronics: { icon: Smartphone, color: '#58a6ff', label: 'Electronics' },
    travel:      { icon: Plane,       color: '#a78bfa', label: 'Travel' },
    beauty:      { icon: Sparkles,    color: '#f0b429', label: 'Beauty' },
    finance:     { icon: CreditCard,  color: '#3fb950', label: 'Finance' },
    recharge:    { icon: Wifi,        color: '#fb923c', label: 'Recharge' },
};

const ALL_CATS = ['all', ...Object.keys(CAT_META)];

const LiveOffers = () => {
    const [data, setData]       = useState({ brand_offers: [], live_deals: [] });
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat]   = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('/investments/live-offers');
            setData(res.data || res);
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, []);

    const filter = arr =>
        (arr || []).filter(o => activeCat === 'all' || o.category === activeCat);

    const brands   = filter(data.brand_offers);
    const hotDeals = filter(data.live_deals);

    const catMeta = cat => CAT_META[cat] || { icon: Tag, color: '#8b949e', label: cat };

    // ── Shared card renderer ────────────────────────────────────────────────
    const OfferCard = ({ offer }) => {
        const meta = catMeta(offer.category);
        const Icon = meta.icon;
        const isHot = (offer.badge || '').includes('Hot');
        return (
            <a href={offer.link} target="_blank" rel="noreferrer noopener"
                style={{ textDecoration: 'none', display: 'block' }}
                onMouseOver={e  => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.45)`; }}
                onMouseOut={e   => { e.currentTarget.style.transform = 'none';             e.currentTarget.style.boxShadow = ''; }}
            >
                <div style={{
                    background: '#161b22',
                    border: `1px solid ${offer.color}40`,
                    borderLeft: `4px solid ${offer.color}`,
                    borderRadius: 14, padding: '18px 18px 14px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative', overflow: 'hidden', height: '100%',
                }}>
                    {/* Glow */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle, ${offer.color}18, transparent 70%)`, pointerEvents: 'none' }} />

                    {/* Badge */}
                    <div style={{ position: 'absolute', top: 12, right: 12, background: isHot ? '#f97316' : offer.color, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.3px' }}>
                        {isHot ? <span>🔥 Hot Deal</span> : offer.badge}
                    </div>

                    {/* Brand pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <div style={{ background: `${offer.color}20`, border: `1px solid ${offer.color}40`, borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Icon size={11} color={offer.color} />
                            <span style={{ fontSize: '0.72rem', color: offer.color, fontWeight: 700 }}>{offer.brand}</span>
                        </div>
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: '0.97rem', fontWeight: 700, color: '#e6edf3', marginBottom: 6, lineHeight: 1.35, paddingRight: 56 }}>
                        {offer.title}
                    </div>

                    {/* Desc */}
                    {offer.desc && (
                        <div style={{ fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.4 }}>{offer.desc}</div>
                    )}

                    {/* CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: '0.8rem', color: offer.color, fontWeight: 700 }}>
                        <ExternalLink size={11} /> <span>View Offers</span> <ChevronRight size={12} />
                    </div>
                </div>
            </a>
        );
    };

    return (
        <div style={{ paddingBottom: '3rem', color: '#c9d1d9' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={22} color="#f0b429" />
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>Live Offers</h1>
                    <span style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                        🔥 Running Now
                    </span>
                </div>
                <button onClick={load} disabled={loading} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', background: '#161b22', border: '1px solid #30363d',
                    borderRadius: 8, color: '#c9d1d9', cursor: 'pointer', fontSize: '0.82rem'
                }}>
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>
            <p style={{ margin: '0 0 1.5rem', color: '#8b949e', fontSize: '0.88rem' }}>
                Click any platform card to go directly to their official deals &amp; offers page.
            </p>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.75rem', scrollbarWidth: 'none' }}>
                {ALL_CATS.map(cat => {
                    const meta   = cat === 'all' ? { color: '#c9d1d9', label: 'All', icon: Zap } : catMeta(cat);
                    const Icon   = meta.icon;
                    const active = activeCat === cat;
                    return (
                        <button key={cat} onClick={() => setActiveCat(cat)} style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                            borderRadius: 20, flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s',
                            background: active ? meta.color : '#161b22',
                            color: active ? '#000' : '#8b949e',
                            border: `1px solid ${active ? meta.color : '#30363d'}`,
                            fontWeight: active ? 700 : 400, fontSize: '0.8rem',
                        }}>
                            <Icon size={11} />{meta.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: 12 }}>
                    <Loader2 size={32} color="#f0b429" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#8b949e', fontSize: '0.88rem' }}>Loading live offers…</span>
                </div>
            ) : (
                <>
                    {/* ── 🔥 Hot Deals from RSS (only when data is fresh/recent) ── */}
                    {hotDeals.length > 0 && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                                <Flame size={18} color="#f97316" />
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Hot Deals Spotted</h2>
                                <span style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '2px 10px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 }}>Last 3 Days</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {hotDeals.map((offer, i) => <OfferCard key={i} offer={offer} />)}
                            </div>
                        </div>
                    )}

                    {/* ── Platform Deals Hub (always-on) ── */}
                    {brands.length > 0 ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                                <div style={{ width: 3, height: 18, background: '#f0b429', borderRadius: 2 }} />
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Platform Deals Hub</h2>
                                <span style={{ color: '#8b949e', fontSize: '0.78rem' }}>{brands.length} platforms • click to visit official offer pages</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {brands.map((offer, i) => <OfferCard key={i} offer={offer} />)}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <Tag size={40} color="#30363d" style={{ margin: '0 auto 1rem', display: 'block' }} />
                            <h3 style={{ color: '#8b949e', fontWeight: 400 }}>No offers in this category right now</h3>
                        </div>
                    )}
                </>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default LiveOffers;
