import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';
import validate from '../middleware/validate.middleware.js';

// === LOGIN ===
export const login = [
    validate(loginSchema),
    async(req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({
                email: email.toLowerCase().trim(),
                isTrashed: false, // ✅ only check trash
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    statusCode: 401,
                    message: 'Invalid credentials',
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    statusCode: 401,
                    message: 'Invalid credentials',
                });
            }

            const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email },
                process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                statusCode: 200,
                message: 'Login successful',
                token,
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
            console.error('Error during login:', err.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error while logging in',
            });
        }
    },
];
// === LOGOUT ===
export const logout = async(req, res) => {
    try {
        // If you are using token blacklisting, you can store the token in a blacklist here.
        // Example: Blacklist.add(req.token);

        res.json({
            success: true,
            statusCode: 200,
            message: 'Logout successful',
        });
    } catch (err) {
        console.error('Error during logout:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while logging out',
        });
    }
};

// === GET CURRENT USER ===
export const getMe = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        // Only check if user exists and is not trashed
        if (!user || user.isTrashed) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'User not found',
            });
        }

        res.json({ success: true, statusCode: 200, user });
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while fetching profile',
        });
    }
};

// === CHANGE PASSWORD ===
export const changePassword = [
    validate(changePasswordSchema),
    async(req, res) => {
        try {
            const user = await User.findById(req.user.id);

            // ✅ Only check if user exists and is not trashed
            if (!user || user.isTrashed) {
                return res.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: 'User not found',
                });
            }

            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: 'Current password is incorrect',
                });
            }

            // Pre-save hook will hash the new password
            user.password = req.body.newPassword;
            await user.save();

            res.json({
                success: true,
                statusCode: 200,
                message: 'Password changed successfully',
            });
        } catch (err) {
            console.error('Error changing password:', err.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error while changing password',
            });
        }
    },
];