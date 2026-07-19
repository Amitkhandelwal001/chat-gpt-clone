import { Router } from 'express';
import { syncUser } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/sync', requireAuth as any, syncUser);

export default router;
