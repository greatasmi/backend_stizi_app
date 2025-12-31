const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phone: { 
        type: String, 
        required: true, 
        unique: true 
    },
    refreshToken: { 
        type: String 
    } // MUST BE DEFINED
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);