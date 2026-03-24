import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../api';

const DashboardLayout = () => {
    const [user, setUser] = useState(() => ({
        name: localStorage.getItem('userName') || '',
    }));
    const location = useLocation();
    const isDashboard = location.pathname === '/app/dashboard';

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await API.get('/auth/me');
                setUser(res.data);
                if (res.data?.name) localStorage.setItem('userName', res.data.name);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();

        // Listen for internal profile updates (e.g., from Settings page)
        const handleProfileUpdate = () => {
            setUser(prev => ({ ...prev, name: localStorage.getItem('userName') || prev.name }));
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, []);

    return (
        <div className="dashboard-container flex">
            <Sidebar />
            <main className="main-content flex-col" style={{ flex: 1, padding: '2rem', height: '100vh', overflowY: 'auto' }}>
                <header className="flex justify-between items-center mb-6 animate-fade-in" style={{ marginBottom: '2rem' }}>

                    {/* LEFT SIDE: Only on Dashboard */}
                    <div style={{ visibility: isDashboard ? 'visible' : 'hidden' }}>
                        <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Global Wealth Optimizer</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {user.name ? `Hi ${user.name}! Welcome back to your financial overview.` : "Welcome back! Here's your financial overview."}
                        </p>
                    </div>

                    {/* RIGHT SIDE: On ALL pages */}
                    <div className="flex items-center gap-4">
                        {user.name && <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</span>}
                        <div className="glass-panel" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #58a6ff, #2ea043)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.name ? user.name[0].toUpperCase() : ''}
                        </div>
                    </div>
                </header>

                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
