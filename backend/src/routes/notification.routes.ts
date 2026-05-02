import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read', markAsRead);

export default router;
