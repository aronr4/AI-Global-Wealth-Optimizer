const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    salary: {
        type: Number,
        default: 0,
    },
    targetSavings: {
        type: Number,
        default: 20, // percentage string/number
    },
    riskAppetite: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    location: {
        type: String,
        default: 'New York, NY',
    }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password payload to hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
