const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        confirmPassword: { type: String },
        roles: { type: Number, default: 2, enum: [0, 1, 2], required: true }, 
        requestUpgrade: { type: Boolean, default: false },
        phone: { type: Number, required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
        access_token: { type: String },
        refresh_token: { type: String },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
