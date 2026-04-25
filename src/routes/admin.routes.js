import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import {
    createUser,
    getAllEmployees,
    getAdminStats,
    softDeleteEmployee,
    restoreEmployee,
    permanentDeleteEmployee,
    getAllLeaves,
    updateLeaveStatus,
    trashLeave,
    restoreLeave,
    permanentDeleteLeave,
    viewLeaveRequestDetail,
    // new handlers for soft-delete/restore employees and leaves
    softDeleteLeave,
    restoreSoftDeletedLeave,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// === USER MANAGEMENT ===
router.post('/users', createUser);
router.get('/employees', getAllEmployees);
router.get('/stats', getAdminStats);

// Soft-delete employee (mark isDeleted + deletedAt)
router.patch('/employees/:id/remove', softDeleteEmployee);

// Restore employee (reset isDeleted + deletedAt)
router.patch('/employees/:id/restore', restoreEmployee);

// Permanently delete employee
router.delete('/employees/:id/permanent', permanentDeleteEmployee);

// === LEAVE MANAGEMENT ===
router.get('/leaves', getAllLeaves);
router.get('/leaves/:id', viewLeaveRequestDetail);

// Update leave status (approve/reject/cancel)
router.patch('/leaves/:id/status', updateLeaveStatus);

// Move leave to trash (isTrashed + trashedAt)
router.patch('/leaves/:id/trash', trashLeave);

// Restore leave from trash
router.patch('/leaves/:id/restore', restoreLeave);

// Soft-delete leave (isDeleted + deletedAt)
router.patch('/leaves/:id/soft-delete', softDeleteLeave);

// Restore soft-deleted leave
router.patch('/leaves/:id/restore-soft', restoreSoftDeletedLeave);

// Permanently delete leave
router.delete('/leaves/:id/permanent', permanentDeleteLeave);

export default router;