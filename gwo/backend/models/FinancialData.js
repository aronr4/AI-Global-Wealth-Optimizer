const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Sub-schemas for comprehensive financial portfolios
const assetSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['stock', 'bond', 'crypto', 'sip', 'cash'], required: true },
    value: { type: Number, required: true },
    allocationPercent: { type: Number },
}, { _id: false });

const expenseSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const savingsGoalSchema = new Schema({
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
});

const financialDataSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalWealth: {
        type: Number,
        default: 0,
    },
    assets: [assetSchema],
    expenses: [expenseSchema],
    savingsGoals: [savingsGoalSchema],
    portfolioHistory: [{
        month: { type: String }, // e.g. "Jan", "Feb"
        value: { type: Number }
    }]
}, { timestamps: true });

const FinancialData = mongoose.model('FinancialData', financialDataSchema);
module.exports = FinancialData;
