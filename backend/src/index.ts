import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import prodEnv from './env.prod.json';

dotenv.config();
if (process.env.NODE_ENV === 'production') {
    try {
        Object.assign(process.env, prodEnv);
    } catch (e) {
        console.error('Failed to load env.prod.json:', e);
    }
}

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const allowedOrigins = [
    'http://localhost:3000', 'http://localhost:3001',
    'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
    'https://genzsosmed.vercel.app',
    'https://calcinvestmu.vercel.app',
    process.env.FRONTEND_URL || ''
].filter(Boolean);

// Socket.io configuration
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

app.set('io', io);

import { globalRateLimiter } from './middlewares/rateLimit.middleware';

// Security and utility middlewares
app.use(helmet());
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
app.use(globalRateLimiter);
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

import { sanitizeBody } from './middlewares/sanitize.middleware';
app.use(sanitizeBody);

// Routes
import storyRoutes from './routes/story.routes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

import { initSocketHandlers } from './services/socket.service';

initSocketHandlers(io);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
