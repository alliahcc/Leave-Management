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
} from '../controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));


router.post('/users', createUser);
router.get('/employees', getAllEmployees);
router.get('/stats', getAdminStats);
router.patch('/employees/:id/remove', softDeleteEmployee);
router.patch('/employees/:id/restore', restoreEmployee);
router.delete('/employees/:id/permanent', permanentDeleteEmployee);


router.get('/leaves', getAllLeaves);
router.get('/leaves/:id', viewLeaveRequestDetail);
router.patch('/leaves/:id/status', updateLeaveStatus);
router.patch('/leaves/:id/trash', trashLeave);
router.patch('/leaves/:id/restore', restoreLeave);
router.delete('/leaves/:id/permanent', permanentDeleteLeave);

export default router;