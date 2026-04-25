import User from '../models/User.model.js';
import Leave from '../models/Leave.model.js';
import { calculateLeaveDays } from '../utils/leaveUtils.js';
import { createUserSchema } from '../validators/user.validator.js';
import { statusUpdateSchema } from '../validators/leave.validator.js';
import validate from '../middleware/validate.middleware.js';

// === USER MANAGEMENT ===
export const createUser = [
    validate(createUserSchema),
    async(req, res) => {
        try {
            const existing = await User.findOne({ email: req.body.email });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: 'Email already exists',
                });
            }

            const user = new User(req.body);
            await user.save();

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'User created successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    lastName: user.lastName,
                    department: user.department,
                    position: user.position,
                    contact: user.contact,
                    email: user.email,
                    role: user.role,
                    leaveBalance: user.leaveBalance,
                    isTrashed: user.isTrashed,
                    trashedAt: user.trashedAt,
                    isDeleted: user.isDeleted,
                    deletedAt: user.deletedAt,
                    createdAt: user.createdAt,
                },
            });
        } catch (err) {
            console.error('Error creating user:', err.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error while creating user',
            });
        }
    },
];

export const getAllEmployees = async(req, res) => {
    try {
        const employees = await User.find({ isDeleted: false, isTrashed: false })
            .select('-password')
            .lean();
        res.json({ success: true, statusCode: 200, employees });
    } catch (err) {
        console.error('Error fetching employees:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching employees' });
    }
};

export const getAdminStats = async(req, res) => {
    try {
        const [totalEmployees, pendingLeaves, approvedLeaves] = await Promise.all([
            User.countDocuments({ isDeleted: false, isTrashed: false }),
            Leave.countDocuments({ status: 'pending', isTrashed: false, isDeleted: false }),
            Leave.countDocuments({ status: 'approved', isTrashed: false, isDeleted: false }),
        ]);
        res.json({
            success: true,
            statusCode: 200,
            stats: { totalEmployees, pendingLeaves, approvedLeaves },
        });
    } catch (err) {
        console.error('Error fetching stats:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching stats' });
    }
};

export const softDeleteEmployee = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { isDeleted: true, deletedAt: new Date() }, { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ success: false, statusCode: 404, message: 'Employee not found' });
        res.json({ success: true, statusCode: 200, message: 'Employee successfully removed' });
    } catch (err) {
        console.error('Error removing employee:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while removing an employee' });
    }
};

export const restoreEmployee = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { isDeleted: false, deletedAt: null }, { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ success: false, statusCode: 404, message: 'Employee not found' });
        res.json({ success: true, statusCode: 200, message: 'Employee restored' });
    } catch (err) {
        console.error('Error restoring employee:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring employee' });
    }
};

export const permanentDeleteEmployee = async(req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, statusCode: 404, message: 'Employee not found' });
        res.json({ success: true, statusCode: 200, message: 'Employee permanently deleted' });
    } catch (err) {
        console.error('Error permanently deleting employee:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while deleting employee' });
    }
};

// === LEAVE MANAGEMENT ===
export const getAllLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: false, isDeleted: false })
            .populate('employee', 'name lastName department position contact email role')
            .lean();
        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching leaves:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching leaves' });
    }
};

export const viewLeaveRequestDetail = async(req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employee', 'name lastName department position contact email role')
            .lean();
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }
        res.json({ success: true, statusCode: 200, leave });
    } catch (err) {
        console.error('Error fetching leave:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateLeaveStatus = [
    validate(statusUpdateSchema),
    async(req, res) => {
        try {
            const leave = await Leave.findById(req.params.id).populate('employee');
            if (!leave) return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });

            if (leave.status !== 'pending') {
                return res.status(400).json({ success: false, statusCode: 400, message: 'Only pending leaves can be updated' });
            }

            leave.status = req.body.status;

            if (req.body.status === 'approved') {
                const days = calculateLeaveDays(leave.startDate, leave.endDate);
                if (leave.employee.leaveBalance < days) {
                    return res.status(400).json({ success: false, statusCode: 400, message: 'Insufficient leave balance' });
                }
                leave.employee.leaveBalance -= days;
                await leave.employee.save();
                leave.duration = days; // ensure duration is set
            }

            await leave.save();
            res.json({ success: true, statusCode: 200, message: `Leave ${req.body.status}`, leave });
        } catch (err) {
            console.error('Error updating leave status:', err.message);
            res.status(500).json({ success: false, statusCode: 500, message: 'Server error while updating leave status' });
        }
    },
];

export const trashLeave = async(req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isTrashed: true, trashedAt: new Date() }, { returnDocument: 'after' }
        );
        if (!leave) return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        res.json({ success: true, statusCode: 200, message: 'Leave moved to trash' });
    } catch (err) {
        console.error('Error trashing leave:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while trashing leave' });
    }
};

export const restoreLeave = async(req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isTrashed: false, trashedAt: null }, { returnDocument: 'after' }
        );
        if (!leave) return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        res.json({ success: true, statusCode: 200, message: 'Leave restored' });
    } catch (err) {
        console.error('Error restoring leave:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring leave' });
    }
};

export const softDeleteLeave = async(req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isDeleted: true, deletedAt: new Date() }, { returnDocument: 'after' }
        );
        if (!leave) return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        res.json({ success: true, statusCode: 200, message: 'Leave soft-deleted' });
    } catch (err) {
        console.error('Error soft-deleting leave:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while soft-deleting leave' });
    }
};

export const restoreSoftDeletedLeave = async(req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isDeleted: false, deletedAt: null }, { returnDocument: 'after' }
        );
        if (!leave) return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        res.json({ success: true, statusCode: 200, message: 'Leave restored from soft-delete' });
    } catch (err) {
        console.error('Error restoring soft-deleted leave:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring soft-deleted leave' });
    }
};

export const permanentDeleteLeave = async(req, res) => {
    try {
        const leave = await Leave.findByIdAndDelete(req.params.id);
        if (!leave) return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        res.json({ success: true, statusCode: 200, message: 'Leave permanently deleted' });
    } catch (err) {
        console.error('Error permanently deleting leave:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while deleting leave' });
    }
};