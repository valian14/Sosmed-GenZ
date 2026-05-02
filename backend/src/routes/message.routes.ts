import { Router } from 'express';
import { getMessages, sendMessage, getConversations } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', getConversations);
router.get('/:partnerId', getMessages);
router.post('/:receiverId', sendMessage);

export default router;
