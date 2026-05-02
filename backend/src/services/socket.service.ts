import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const userSockets = new Map<string, string>();

export const initSocketHandlers = (io: Server) => {
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret');
            (socket as any).userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = (socket as any).userId;
        userSockets.set(userId, socket.id);

        console.log(`User connected: ${userId} with socket ${socket.id}`);

        // Broadcast online status
        io.emit('user_online', userId);

        socket.on('typing_start', ({ receiverId }) => {
            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit('typing_start', { senderId: userId });
            }
        });

        socket.on('typing_stop', ({ receiverId }) => {
            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit('typing_stop', { senderId: userId });
            }
        });

        socket.on('story_like', ({ receiverId }) => {
            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit('story_like', { senderId: userId });
            }
        });

        socket.on('disconnect', () => {
            userSockets.delete(userId);
            console.log(`User disconnected: ${userId}`);
            io.emit('user_offline', userId);
        });
    });
};

export const getReceiverSocketId = (receiverId: string) => {
    return userSockets.get(receiverId);
};
