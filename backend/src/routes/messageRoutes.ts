import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/messageController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/:conversationId', getMessages);
router.post('/:conversationId', sendMessage);

export default router;
