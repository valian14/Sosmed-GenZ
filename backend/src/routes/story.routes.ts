import express from 'express';
import { createStory, getFeedStories, likeStory, viewStory } from '../controllers/story.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = express.Router();

router.use(authMiddleware);
router.post('/', createStory);
router.get('/', getFeedStories);
router.post('/:id/like', likeStory);
router.post('/:id/view', viewStory);

export default router;

// Reload trigger
