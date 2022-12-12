const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name required']
    },
    email: {
        type: String,
        required: [true, 'email required']
    },
    password: {
        type: String,
        required: [true, 'password required']
    },
    otp: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    otpFailedLogin: {
        type: Number,
        default: 0
    },
    otpExpiredAt: {
        type: Date
    }
}, {
    timestamps: true
})

const User = mongoose.model('User', userSchema)

module.exports = User