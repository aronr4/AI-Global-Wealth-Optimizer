const express = require('express');
const router = express.Router();
const FinancialData = require('../models/FinancialData');
const User = require('../models/User');

// Middleware to mock auth just for the prototype's sake.
const mockProtect = async (req, res, next) => {
    try {
        const user = await User.findOne();
        if (!user) {
            // Create an anonymous user just so the API can function for the demo
            const demoUser = await User.create({ email: 'demo@gwo.ai', password: 'password123' });
            req.user = demoUser;
        } else {
            req.user = user;
        }
        next();
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

router.get('/dashboard', mockProtect, async (req, res) => {
    try {
        let data = await FinancialData.findOne({ user: req.user._id });
        if (!data) {
            // Seed mock data corresponding to the UI values
            data = await FinancialData.create({
                user: req.user._id,
                totalWealth: 124500,
                assets: [
                    { name: 'S&P 500', type: 'stock', value: 68475, allocationPercent: 55 },
                    { name: 'Treasury Bonds', type: 'bond', value: 24900, allocationPercent: 20 },
                    { name: 'Index SIP', type: 'sip', value: 18675, allocationPercent: 15 },
                    { name: 'Liquid Cash', type: 'cash', value: 12450, allocationPercent: 10 },
                ],
                portfolioHistory: [
                    { month: 'Jan', value: 100000 },
                    { month: 'Feb', value: 105000 },
                    { month: 'Mar', value: 102000 },
                    { month: 'Apr', value: 110000 },
                    { month: 'May', value: 115000 },
                    { month: 'Jun', value: 112000 },
                    { month: 'Jul', value: 124500 },
                ]
            });
        }
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/expenses', mockProtect, async (req, res) => {
    try {
        const { name, category, amount } = req.body;
        const data = await FinancialData.findOne({ user: req.user._id });
        data.expenses.push({ name, category, amount });
        await data.save();
        res.json({ success: true, data: data.expenses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// MCP Mock Layer
router.get('/ai-insights', mockProtect, async (req, res) => {
    // Simulating RAG + MCP Logic returning personalized advice
    const insights = {
        riskProfile: req.user.riskAppetite,
        suggestions: [
            { type: 'optimization', message: 'You are overspending on Food by 15%.' },
            { type: 'investment', message: 'Market volatility is low. Increase SIP by 5%.' },
            { type: 'local', message: 'Switch to FitLife Gym to save $30/month.' }
        ]
    };
    res.json({ success: true, data: insights });
});

module.exports = router;
