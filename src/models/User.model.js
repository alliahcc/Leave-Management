import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    role: {
        type: String,
        enum: ['employee', 'admin'],
        default: 'employee',
    },
    leaveBalance: {
        type: Number,
        default: 20,
        min: 0,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Indexes
userSchema.index({ role: 1, isDeleted: 1 });

// Virtuals
userSchema.virtual('isActive').get(function() {
    return !this.isDeleted;
});

// Pre-save: normalize email + hash password
userSchema.pre('save', async function() {
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }

    if (this.isModified('password')) {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
});

// Method (optional)
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);