import { Router } from 'express';
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  continueInNewChat,
} from '../controllers/conversationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/', getConversations);
router.post('/', createConversation);
router.post('/continue', continueInNewChat);
router.patch('/:id', updateConversation);
router.delete('/:id', deleteConversation);

export default router;
