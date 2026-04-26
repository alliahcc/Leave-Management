import User from '../models/User.model.js';
import Leave from '../models/Leave.model.js';
import { calculateLeaveDays } from '../utils/leaveUtils.js';
import { createLeaveSchema } from '../validators/leave.validator.js';
import validate from '../middleware/validate.middleware.js';

// === EMPLOYEE PROFILE ===
export const getEmployeeById = async(req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === 'employee' && req.user.id !== id) {
            return res.status(403).json({
                success: false,
                statusCode: 403,
                message: 'Access denied',
            });
        }

        const user = await User.findOne({ _id: id, isTrashed: false })
            .select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'Employee not found',
            });
        }

        res.json({ success: true, statusCode: 200, user });
    } catch (err) {
        console.error('Error fetching employee:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching employee' });
    }
};

// === LEAVE MANAGEMENT ===
export const getMyLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({
                employee: req.user.id,
                isTrashed: false,
            })
            .sort({ createdAt: -1 })
            .populate('employee', 'name lastName department position contact email role')
            .lean();

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching leaves:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching leaves' });
    }
};

export const createLeave = [
    validate(createLeaveSchema),
    async(req, res) => {
        try {
            const employee = await User.findById(req.user.id);
            if (!employee || employee.isTrashed) {
                return res.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: 'Employee not found',
                });
            }

            const { duration } = calculateLeaveDays(req.body.startDate, req.body.endDate);

            if (employee.leaveBalance < duration) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: 'Insufficient leave balance for requested days',
                });
            }

            const leave = new Leave({
                ...req.body,
                employee: req.user.id,
                employeeName: employee.name,
                employeeLastName: employee.lastName,
                duration,
                status: 'pending',
                isTrashed: false,
                trashedAt: null,
            });

            await leave.save();

            res.status(201).json({
                success: true,
                statusCode: 201,
                message: 'Leave request created successfully',
                leave,
            });
        } catch (err) {
            console.error('Error creating leave:', err.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error while creating leave',
            });
        }
    },
];

export const cancelLeave = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Authentication required',
            });
        }

        const leave = await Leave.findOne({
            _id: req.params.id,
            employee: req.user.id,
            isTrashed: false,
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'Leave not found or you do not have permission to cancel it',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: `Only pending leaves can be cancelled. Current status: ${leave.status}`,
            });
        }

        leave.status = 'cancelled';
        await leave.save();

        res.json({
            success: true,
            statusCode: 200,
            message: 'Leave cancelled successfully',
            leave,
        });
    } catch (err) {
        console.error('Error cancelling leave:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while cancelling leave',
        });
    }
};

// === TRASH & RESTORE LEAVES (Employee) ===
export const trashMyLeave = async(req, res) => {
    try {
        const leave = await Leave.findOne({
            _id: req.params.id,
            employee: req.user.id,
            isTrashed: false,
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'Leave not found or already trashed',
            });
        }

        leave.isTrashed = true;
        leave.trashedAt = new Date();
        await leave.save();

        res.json({
            success: true,
            statusCode: 200,
            message: 'Leave moved to trash successfully',
            leave,
        });
    } catch (err) {
        console.error('Error trashing leave:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while trashing leave',
        });
    }
};

export const restoreMyLeave = async(req, res) => {
    try {
        const leave = await Leave.findOne({
            _id: req.params.id,
            employee: req.user.id,
            isTrashed: true,
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'Leave not found or not trashed',
            });
        }

        leave.isTrashed = false;
        leave.trashedAt = null;
        await leave.save();

        res.json({
            success: true,
            statusCode: 200,
            message: 'Leave restored successfully',
            leave,
        });
    } catch (err) {
        console.error('Error restoring leave:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while restoring leave',
        });
    }
};