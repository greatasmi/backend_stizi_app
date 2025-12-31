require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Database Connection (Improved for Serverless)
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        // Ensure MONGODB_URI is in your Vercel/Local .env
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
    }
};

// 2. Helper Functions
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } 
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        process.env.REFRESH_SECRET, // Use the new secret you generated
        { expiresIn: '7d' } 
    );
};

// 3. Auth Route
// Note: Ensure Postman hits exactly: /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        await connectDB();
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: "Phone and OTP are required" });
        }

        if (otp !== '123456') {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token to DB
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: "Login Successful",
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        console.error("Auth Error:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 4. Token Refresh Route
app.post('/api/auth/refresh', async (req, res) => {
    try {
        await connectDB();
        const { token } = req.body;
        if (!token) return res.status(401).json({ message: "No token provided" });

        const payload = jwt.verify(token, process.env.REFRESH_SECRET);
        const user = await User.findById(payload.userId);

        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        res.status(403).json({ message: "Token expired or invalid" });
    }
});

// Root Route
app.get('/', (req, res) => res.send("Stizi Dynamic API is Live! 🚀"));

// --- LOCAL LISTENER ---
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally at http://localhost:${PORT}`);
        connectDB(); // Pre-connect locally
    });
}

module.exports = app;