const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FinancialData = require('../models/FinancialData');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

router.post('/register', async (req, res) => {
    const { email, password, salary, riskAppetite } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            email,
            password,
            salary,
            riskAppetite
        });

        // Initialize Empty Financial Data
        await FinancialData.create({ user: user._id });

        if (user) {
            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    email: user.email,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    email: user.email,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
