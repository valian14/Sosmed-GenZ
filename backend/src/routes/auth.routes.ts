import { Router } from 'express';
import { register, login, logout, verifyEmail, getRefreshToken } from '../controllers/auth.controller';
import { registerRateLimiter, loginRateLimiter } from '../middlewares/rateLimit.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

router.post('/register', registerRateLimiter, validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', getRefreshToken);
router.get('/verify', verifyEmail);

export default router;
