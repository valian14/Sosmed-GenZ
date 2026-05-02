import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createStory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { content, media_url } = req.body;

        if (!media_url && !content) {
            return res.status(400).json({ error: 'Story must have content or media' });
        }

        // Expires 24 hours from creation native timezone
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = await prisma.story.create({
            data: {
                user_id: userId,
                content,
                media_url,
                expires_at: expiresAt
            }
        });

        res.status(201).json(story);
    } catch (error: any) {
        console.error("Story creation error:", error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

export const getFeedStories = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Collect all target network IDs including ourselves
        const following = await prisma.follow.findMany({
            where: { follower_id: userId },
            select: { following_id: true }
        });
        const followingIds = following.map(f => f.following_id);
        followingIds.push(userId);

        const activeStories = await prisma.story.findMany({
            where: {
                user_id: { in: followingIds },
                expires_at: { gt: new Date() } // Native expiry boundary bypass
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                likes: { select: { user: { select: { id: true, username: true, avatar: true } } } },
                views: { select: { user: { select: { id: true, username: true, avatar: true } } } }
            },
            orderBy: { created_at: 'asc' }
        });

        // Group mapping format array structures for React frontend parsing
        const groupedMap = activeStories.reduce((acc: any, story) => {
            if (!acc[story.user_id]) acc[story.user_id] = { user: story.user, stories: [] };
            acc[story.user_id].stories.push(story);
            return acc;
        }, {});

        res.json(Object.values(groupedMap));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const likeStory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const story = await (prisma as any).story.findUnique({ where: { id: id as string } });
        if (!story) return res.status(404).json({ error: 'Story not found' });

        const existingLike = await (prisma as any).storyLike.findUnique({
            where: { story_id_user_id: { story_id: id as string, user_id: userId as string } }
        });

        if (existingLike) {
            await (prisma as any).storyLike.delete({ where: { id: existingLike.id } });
            res.json({ message: 'Unliked', liked: false });
        } else {
            await (prisma as any).storyLike.create({
                data: { story_id: id as string, user_id: userId as string }
            });
            if (story.user_id !== userId) {
                await prisma.notification.create({
                    data: {
                        user_id: story.user_id as string,
                        actor_id: userId as string,
                        type: 'like',
                        reference_id: id as string
                    }
                });
            }
            res.json({ message: 'Liked', liked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const viewStory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId as string;
        const id = req.params.id as string;

        const story = await (prisma as any).story.findUnique({ where: { id } });
        if (!story) return res.status(404).json({ error: 'Story not found' });

        if (story.user_id === userId) return res.json({ message: 'Owner view, ignored' });

        const existingView = await (prisma as any).storyView.findUnique({
            where: { story_id_user_id: { story_id: id, user_id: userId } }
        });

        if (!existingView) {
            await (prisma as any).storyView.create({
                data: { story_id: id, user_id: userId }
            });
        }
        res.json({ message: 'Viewed', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
