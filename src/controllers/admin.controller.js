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
        const employees = await User.find({ isTrashed: false })
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
            User.countDocuments({ isTrashed: false }),
            Leave.countDocuments({ status: 'pending', isTrashed: false }),
            Leave.countDocuments({ status: 'approved', isTrashed: false }),
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

// === UPDATE EMPLOYEE ===
export const updateEmployee = async(req, res) => {
    try {
        const { id } = req.params;

        const updates = {
            name: req.body.name,
            lastName: req.body.lastName,
            department: req.body.department,
            position: req.body.position,
            contact: req.body.contact,
            email: req.body.email,
            role: req.body.role,
            leaveBalance: req.body.leaveBalance,
            updatedAt: new Date(),
        };

        const user = await User.findByIdAndUpdate(
            id,
            updates, { returnDocument: 'after' } // ✅ replaces { new: true }
        ).select("-password");;

        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: "Employee not found",
            });
        }

        res.json({
            success: true,
            statusCode: 200,
            message: "Employee updated successfully",
            user,
        });
    } catch (err) {
        console.error("Error updating employee:", err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Server error while updating employee",
        });
    }
};

export const trashEmployee = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { isTrashed: true, trashedAt: new Date() }, { returnDocument: 'after' } // ✅ correct option
        );

        if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, message: 'Employee moved to trash', user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error while trashing employee' });
    }
};

export const restoreEmployee = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, { isTrashed: false, trashedAt: null }, { returnDocument: 'after' } // ✅ correct option
        );

        if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, message: 'Employee restored', user });
    } catch (err) {
        console.error('Error restoring employee:', err.message);
        res.status(500).json({ success: false, message: 'Server error while restoring employee' });
    }
};

// === GET TRASHED EMPLOYEES ===
export const getTrashedEmployees = async(req, res) => {
    try {
        const employees = await User.find({ isTrashed: true })
            .select('-password')
            .lean();

        res.json({ success: true, statusCode: 200, employees });
    } catch (err) {
        console.error('Error fetching trashed employees:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while fetching trashed employees',
        });
    }
};

// === LEAVE MANAGEMENT ===
export const getAllLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: false })
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
            leave.remarks = req.body.remarks || leave.remarks;

            if (req.body.status === 'approved') {
                const days = calculateLeaveDays(leave.startDate, leave.endDate);
                if (leave.employee.leaveBalance < days) {
                    return res.status(400).json({ success: false, statusCode: 400, message: 'Insufficient leave balance' });
                }
                leave.employee.leaveBalance -= days;
                await leave.employee.save();
                leave.duration = days;
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
        res.json({ success: true, statusCode: 200, message: 'Leave restored', leave });
    } catch (err) {
        console.error('Error restoring leave:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring leave' });
    }
};
// === GET TRASHED LEAVES ===
export const getTrashedLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: true })
            .populate('employee', 'name lastName department position contact email role')
            .lean();

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching trashed leaves:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while fetching trashed leaves',
        });
    }
};