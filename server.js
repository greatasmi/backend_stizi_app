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

// 1. Improved MongoDB Connection for Vercel
// This prevents multiple connections in a serverless environment
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
};

// 2. Base Route to check if server is live
app.get('/', (req, res) => {
    res.send("Stizi Backend is Running Successfully!");
});

// 3. Auth Route
app.post('/api/auth/verify-otp', async (req, res) => {
    await connectDB(); // Ensure DB is connected before query
    const { phone, otp } = req.body;

    if (otp !== '123456') {
        return res.status(400).json({ message: "Invalid OTP code" });
    }

    try {
        let user = await User.findOne({ phone });

        if (!user) {
            user = new User({ phone });
            await user.save();
        }

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
        console.error("Error details:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// For local development
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;