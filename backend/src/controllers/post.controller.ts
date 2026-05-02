import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createPost = async (req: Request, res: Response) => {
    try {
        const { content, media_url } = req.body;
        const userId = (req as any).user.userId;

        const post = await prisma.post.create({
            data: {
                content,
                media_url,
                user_id: userId,
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            }
        });

        // TODO: Socket.io broadcast to followers

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getFeed = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;

        const following = await prisma.follow.findMany({
            where: { follower_id: userId },
            select: { following_id: true }
        });

        const followingIds = following.map(f => f.following_id);
        followingIds.push(userId); // include own posts

        const posts = await prisma.post.findMany({
            where: { user_id: { in: followingIds } },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                likes: { where: { user_id: userId }, select: { id: true } },
                reposts: { where: { user_id: userId }, select: { id: true } },
                comments: {
                    include: {
                        user: { select: { id: true, username: true, avatar: true } }
                    },
                    orderBy: { created_at: 'asc' }
                },
                _count: { select: { likes: true, comments: true, reposts: true } }
            },
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.userId;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        await prisma.post.delete({ where: { id } });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const likePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.userId;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const existingLike = await prisma.like.findUnique({
            where: { user_id_post_id: { user_id: userId, post_id: id } }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            // Optionally delete notification here
            return res.json({ message: 'Unliked successfully' });
        }

        await prisma.like.create({
            data: { user_id: userId, post_id: id }
        });

        // if (post.user_id !== userId) {
        await prisma.notification.create({
            data: {
                user_id: post.user_id,
                actor_id: userId,
                type: 'like',
                reference_id: id
            }
        });
        // }

        res.json({ message: 'Liked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const commentPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.userId;
        const { content } = req.body;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comment = await prisma.comment.create({
            data: {
                post_id: id,
                user_id: userId,
                content
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            }
        });

        // if (post.user_id !== userId) {
        await prisma.notification.create({
            data: {
                user_id: post.user_id,
                actor_id: userId,
                type: 'comment',
                reference_id: id
            }
        });
        // }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const likeComment = async (req: Request, res: Response) => {
    try {
        const { id, commentId } = req.params as { id: string, commentId: string };
        const userId = (req as any).user.userId;

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // if (comment.user_id !== userId) {
        await prisma.notification.create({
            data: {
                user_id: comment.user_id,
                actor_id: userId,
                type: 'comment_like',
                reference_id: commentId
            }
        });
        // }

        res.json({ message: 'Comment liked' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const repostPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.userId;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const existingRepost = await prisma.repost.findUnique({
            where: { user_id_post_id: { user_id: userId, post_id: id } }
        });

        if (existingRepost) {
            await prisma.repost.delete({ where: { id: existingRepost.id } });
            return res.json({ message: 'Unreposted successfully' });
        }

        await prisma.repost.create({
            data: { user_id: userId, post_id: id }
        });

        // if (post.user_id !== userId) {
        await prisma.notification.create({
            data: {
                user_id: post.user_id,
                actor_id: userId,
                type: 'repost',
                reference_id: id
            }
        });
        // }

        res.json({ message: 'Reposted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const editPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.userId;
        const { content } = req.body;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        const updatedPost = await prisma.post.update({
            where: { id },
            data: { content },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                _count: { select: { likes: true, comments: true, reposts: true } }
            }
        });

        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const pinPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user.userId;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

        if (post.is_pinned) {
            const updatedPost = await prisma.post.update({
                where: { id },
                data: { is_pinned: false }
            });
            return res.json({ message: 'Post unpinned', post: updatedPost });
        }

        await prisma.post.updateMany({
            where: { user_id: userId, is_pinned: true },
            data: { is_pinned: false }
        });

        const updatedPost = await prisma.post.update({
            where: { id },
            data: { is_pinned: true }
        });

        res.json({ message: 'Post pinned successfully', post: updatedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
