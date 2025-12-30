const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// 1️⃣ SEND OTP (Signup & Login)
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: 'Phone required' });

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone });
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  await user.save();

  console.log('OTP (DEV):', otp); // Replace with SMS gateway

  res.json({ message: 'OTP sent successfully' });
};

// 2️⃣ VERIFY OTP
exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });

  if (!user) return res.status(404).json({ message: 'User not found' });

  if (
    user.otp !== otp ||
    user.otpExpiresAt < Date.now()
  ) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      phone: user.phone
    }
  });
};
