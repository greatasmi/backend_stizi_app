require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User'); // Fixed path (removed /src)

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB (Using MONGODB_URI from your .env)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 2. Auth Route
app.post('/api/auth/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;

    // Hardcoded OTP for testing
    if (otp !== '123456') {
        return res.status(400).json({ message: "Invalid OTP code" });
    }

    try {
        // Check if user exists
        let user = await User.findOne({ phone });

        if (!user) {
            user = new User({ phone });
            await user.save();
        }

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

module.exports = app; // Add this at the end of server.js