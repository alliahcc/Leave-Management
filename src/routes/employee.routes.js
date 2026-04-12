import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
    getEmployeeById,
    getMyLeaves,
    createLeave,
    cancelLeave,
} from '../controllers/employee.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/employees/:id', getEmployeeById);
router.get('/leaves/my', getMyLeaves);
router.post('/leaves', createLeave);
router.patch('/leaves/:id/cancel', cancelLeave);

export default router;