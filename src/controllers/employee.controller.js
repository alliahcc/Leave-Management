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

        const user = await User.findOne({ _id: id, isDeleted: false }).select('-password');
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
        const leaves = await Leave.find({ employee: req.user.id, isTrashed: false })
            .sort({ createdAt: -1 })
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
            if (!employee || employee.isDeleted) {
                return res.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: 'Employee not found',
                });
            }

            const days = calculateLeaveDays(req.body.startDate, req.body.endDate);
            if (employee.leaveBalance < days) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: 'Insufficient leave balance for requested days',
                });
            }

            const leave = new Leave({
                ...req.body,
                employee: req.user.id,
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
            res.status(500).json({ success: false, statusCode: 500, message: 'Server error while creating leave' });
        }
    },
];

export const cancelLeave = async(req, res) => {
    try {
        // Safety: ensure we have a valid user from auth middleware
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
            isTrashed: false, // don't allow cancelling trashed leaves
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
        // Extra dev logging to help future debugging
        if (process.env.NODE_ENV === 'development') {
            console.error(err.stack);
        }

        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while cancelling leave',
        });
    }
};