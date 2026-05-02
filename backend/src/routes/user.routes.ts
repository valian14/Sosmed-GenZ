import { Router } from 'express';
import { getProfile, updateProfile, followUser, getSuggestions, getUserPosts, searchUser, getUserById, getUserLikes, getUserFollowers, getUserFollowing } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/suggestions', getSuggestions);
router.get('/search', searchUser);
router.get('/id/:id', getUserById);
router.get('/:username', getProfile);
router.get('/:username/posts', getUserPosts);
router.get('/:username/likes', getUserLikes);
router.get('/:username/followers', getUserFollowers);
router.get('/:username/following', getUserFollowing);
router.put('/', updateProfile);
router.post('/:followingId/follow', followUser);

export default router;

