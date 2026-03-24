// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Expenses from './pages/Expenses';
import SavingsGoals from './pages/SavingsGoals';
import LocalDeals from './pages/LocalDeals';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Legacy redirect: /dashboard → /app/dashboard */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />

        {/* Main app with sidebar layout */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="goals" element={<SavingsGoals />} />
          <Route path="local" element={<LocalDeals />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
