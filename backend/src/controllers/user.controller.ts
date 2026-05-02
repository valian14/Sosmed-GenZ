import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getReceiverSocketId } from '../services/socket.service';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params as { username: string };
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                links: true,
                banner: true,
                created_at: true,
                _count: {
                    select: { followers: true, following: true }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                links: true,
                banner: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { bio, avatar, banner, links } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { bio, avatar, banner, links },
            select: { id: true, username: true, avatar: true, bio: true, links: true, banner: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Server error', details: String(error) });
    }
};

export const followUser = async (req: Request, res: Response) => {
    try {
        const followerId = (req as any).user.userId;
        const { followingId } = req.params as { followingId: string };

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const existingFollow = await prisma.follow.findUnique({
            where: { follower_id_following_id: { follower_id: followerId, following_id: followingId } }
        });

        if (existingFollow) {
            await prisma.follow.delete({ where: { id: existingFollow.id } });
            return res.json({ message: 'Unfollowed successfully' });
        } else {
            await prisma.follow.create({
                data: { follower_id: followerId, following_id: followingId }
            });
            const notification = await prisma.notification.create({
                data: {
                    user_id: followingId,
                    actor_id: followerId,
                    type: 'follow',
                },
                include: { actor: { select: { id: true, username: true, avatar: true } } }
            });
            const io = req.app.get('io');
            if (io) {
                const receiverSocket = getReceiverSocketId(followingId);
                if (receiverSocket) {
                    io.to(receiverSocket).emit('new_notification', notification);
                }
            }
            return res.json({ message: 'Followed successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Simple suggestion: users not currently followed
        const following = await prisma.follow.findMany({
            where: { follower_id: userId },
            select: { following_id: true }
        });
        const followingIds = following.map(f => f.following_id);
        followingIds.push(userId);

        const suggestions = await prisma.user.findMany({
            where: { id: { notIn: followingIds } },
            select: { id: true, username: true, avatar: true, bio: true, links: true },
            take: 5
        });

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserPosts = async (req: Request, res: Response) => {
    try {
        const { username } = req.params as { username: string };
        const requestingUserId = (req as any).user?.userId;

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const posts = await prisma.post.findMany({
            where: { user_id: targetUser.id },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                likes: requestingUserId ? { where: { user_id: requestingUserId }, select: { id: true } } : false,
                reposts: requestingUserId ? { where: { user_id: requestingUserId }, select: { id: true } } : false,
                comments: {
                    include: {
                        user: { select: { id: true, username: true, avatar: true } }
                    },
                    orderBy: { created_at: 'asc' }
                },
                _count: { select: { likes: true, comments: true, reposts: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserLikes = async (req: Request, res: Response) => {
    try {
        const { username } = req.params as { username: string };
        const requestingUserId = (req as any).user?.userId;

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const likes = await prisma.like.findMany({
            where: { user_id: targetUser.id },
            include: {
                post: {
                    include: {
                        user: { select: { id: true, username: true, avatar: true } },
                        likes: requestingUserId ? { where: { user_id: requestingUserId }, select: { id: true } } : false,
                        reposts: requestingUserId ? { where: { user_id: requestingUserId }, select: { id: true } } : false,
                        comments: {
                            include: {
                                user: { select: { id: true, username: true, avatar: true } }
                            },
                            orderBy: { created_at: 'asc' }
                        },
                        _count: { select: { likes: true, comments: true, reposts: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const likedPosts = likes.map(like => like.post);
        res.json(likedPosts);
    } catch (error) {
        console.error("Error fetching likes:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserFollowers = async (req: Request, res: Response) => {
    try {
        const { username } = req.params as { username: string };
        const currentUserId = (req as any).user.userId;

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const followersData = await prisma.follow.findMany({
            where: { following_id: targetUser.id },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        links: true,
                        followers: {
                            where: { follower_id: currentUserId },
                            select: { id: true }
                        }
                    }
                }
            }
        });

        const mapped = followersData.map(f => ({
            id: f.follower.id,
            username: f.follower.username,
            avatar: f.follower.avatar,
            bio: f.follower.bio,
            links: f.follower.links,
            isFollowing: f.follower.followers.length > 0
        }));

        res.json(mapped);
    } catch (error) {
        console.error("Followers err", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserFollowing = async (req: Request, res: Response) => {
    try {
        const { username } = req.params as { username: string };
        const currentUserId = (req as any).user.userId;

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const followingData = await prisma.follow.findMany({
            where: { follower_id: targetUser.id },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        links: true,
                        followers: {
                            where: { follower_id: currentUserId },
                            select: { id: true }
                        }
                    }
                }
            }
        });

        const mapped = followingData.map(f => ({
            id: f.following.id,
            username: f.following.username,
            avatar: f.following.avatar,
            bio: f.following.bio,
            links: f.following.links,
            isFollowing: f.following.followers.length > 0
        }));

        res.json(mapped);
    } catch (error) {
        console.error("Following err", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const searchUser = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const currentUserId = (req as any).user.userId;

        if (!query) {
            return res.json([]);
        }

        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: query,
                }
            },
            take: 20,
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                links: true,
                followers: {
                    where: { follower_id: currentUserId },
                    select: { id: true }
                }
            }
        });

        // map to matching frontend format
        const mappedUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            links: u.links,
            isFollowing: u.followers.length > 0
        }));

        res.json(mappedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
