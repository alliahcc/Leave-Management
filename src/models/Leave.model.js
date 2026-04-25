import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    employeeName: { type: String, required: true, trim: true }, // Added
    employeeLastName: { type: String, required: true, trim: true }, // Added

    leaveType: {
        type: String,
        enum: ['vacation', 'sick', 'personal', 'other'],
        required: true,
        trim: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true }, // Added
    reason: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending',
    },
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false }, // Added
    deletedAt: { type: Date, default: null }, // Added
}, { timestamps: true });

// Indexes
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ isTrashed: 1 });
leaveSchema.index({ isDeleted: 1 }); // Added

// Virtual: leaveDays
leaveSchema.virtual('leaveDays').get(function() {
    if (this.startDate && this.endDate) {
        const diff = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    }
    return 0;
});

// Pre-save validation
leaveSchema.pre('save', async function() {
    // Validate date range
    if (this.endDate < this.startDate) {
        throw new Error('End date cannot be before start date');
    }
});

leaveSchema.set('toJSON', { virtuals: true });
leaveSchema.set('toObject', { virtuals: true });

export default mongoose.model('Leave', leaveSchema);