import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, TrendingUp, Target, Tag, Settings } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Stock Portfolio', path: '/app/portfolio', icon: <TrendingUp size={20} /> },
        { name: 'Expenses', path: '/app/expenses', icon: <PieChart size={20} /> },
        { name: 'Savings Goals', path: '/app/goals', icon: <Target size={20} /> },
        { name: 'Online Deals', path: '/app/local', icon: <Tag size={20} /> },
    ];

    return (
        <aside className="glass-panel flex-col" style={{ width: '260px', height: 'calc(100vh - 2rem)', margin: '1rem', padding: '1.5rem', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
            <div className="logo flex items-center gap-2" style={{ marginBottom: '3rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'white', overflow: 'hidden' }} className="flex items-center justify-center">
                    <img src="/logo.png1.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>GWO<span style={{ color: 'var(--accent-color)' }}>.AI</span></h2>
            </div>

            <nav className="flex-col gap-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `flex items-center gap-4 glass-button ${isActive ? 'primary' : ''}`}
                        style={{ padding: '0.75rem 1rem', textDecoration: 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Spacer to separate Settings from main nav */}
            <div style={{ marginTop: '50px' }}>
                <NavLink
                    to="/app/settings"
                    className={({ isActive }) => `flex items-center gap-4 glass-button ${isActive ? 'primary' : ''}`}
                    style={{ padding: '0.75rem 1rem', textDecoration: 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
