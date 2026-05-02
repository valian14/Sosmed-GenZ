import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const notifications = await prisma.notification.findMany({
            where: { user_id: userId },
            include: {
                actor: { select: { id: true, username: true, avatar: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        await prisma.notification.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true }
        });

        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
