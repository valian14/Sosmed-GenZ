import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getReceiverSocketId } from '../services/socket.service';

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { partnerId } = req.params as { partnerId: string };

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { sender_id: userId, receiver_id: partnerId },
                    { sender_id: partnerId, receiver_id: userId }
                ]
            },
            orderBy: { created_at: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.userId;
        const { receiverId } = req.params as { receiverId: string };
        const { content } = req.body;

        const message = await prisma.message.create({
            data: {
                content,
                sender_id: senderId,
                receiver_id: receiverId
            }
        });

        const notification = await prisma.notification.create({
            data: {
                user_id: receiverId,
                actor_id: senderId,
                type: 'message'
            },
            include: { actor: { select: { id: true, username: true, avatar: true } } }
        });

        const io = req.app.get('io');
        if (io) {
            const receiverSocket = getReceiverSocketId(receiverId);
            if (receiverSocket) {
                // Notifikasi pesan baru dengan nama sender
                io.to(receiverSocket).emit('new_notification', notification);
                io.to(receiverSocket).emit('new_message', message);
            }
        }
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // A simple query to get distinct users we have conversed with is complex in Prisma.
        const messages = await prisma.message.findMany({
            where: { OR: [{ sender_id: userId }, { receiver_id: userId }] },
            orderBy: { created_at: 'desc' },
            include: {
                sender: { select: { id: true, username: true, avatar: true } },
                receiver: { select: { id: true, username: true, avatar: true } }
            }
        });

        const conversationsMap = new Map();
        for (const msg of messages) {
            const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
            if (!conversationsMap.has(partner.id)) {
                conversationsMap.set(partner.id, {
                    partner,
                    lastMessage: msg
                });
            }
        }

        res.json(Array.from(conversationsMap.values()));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
