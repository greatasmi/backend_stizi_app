require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Dynamic Database Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ Connection Error:", err);
    }
};

// 2. Helper Functions for Dynamic Token Generation
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
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' } 
    );
};

// 3. Dynamic Auth Route
app.post('/api/auth/verify-otp', async (req, res) => {
    await connectDB();
    const { phone, otp } = req.body;

    if (otp !== '123456') return res.status(400).json({ message: "Invalid OTP" });

    try {
        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: "Login Successful",
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// 4. Token Refresh Route
app.post('/api/auth/refresh', async (req, res) => {
    await connectDB();
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
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

app.get('/', (req, res) => res.send("Stizi Dynamic API is Live............! "));

// --- FIXED SECTION: SERVER LISTENER ---
// This part ensures the app stays running during 'npm run dev'
const PORT = process.env.PORT || 5000;

// Only start the listener if we are NOT on Vercel's production environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally at http://localhost:${PORT}`);
        // Log to confirm DB connection attempt on startup
        connectDB();
    });
}

module.exports = app;