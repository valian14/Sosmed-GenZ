import { Router } from 'express';
import { createPost, getFeed, deletePost, likePost, commentPost, likeComment, repostPost, editPost, pinPost } from '../controllers/post.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createPost);
router.get('/feed', getFeed);
router.delete('/:id', deletePost);
router.put('/:id', editPost);
router.post('/:id/pin', pinPost);
router.post('/:id/like', likePost);
router.post('/:id/repost', repostPost);
router.post('/:id/comments', commentPost);
router.post('/:id/comments/:commentId/like', likeComment);

export default router;
