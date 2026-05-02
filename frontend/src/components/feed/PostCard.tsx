"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Send, Trash, Edit, Pin, X, Check, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Post {
    id: string;
    content: string;
    media_url?: string;
    created_at: string;
    user: {
        id: string;
        username: string;
        avatar: string | null;
    };
    likes?: { id: string }[];
    reposts?: { id: string }[];
    comments?: any[];
    _count: {
        likes: number;
        comments: number;
        reposts: number;
    };
    is_pinned?: boolean;
}

export default function PostCard({ post, onLike }: { post: Post, onLike?: (id: string, dir: number) => void }) {
    const { user } = useAuthStore();
    const [liked, setLiked] = useState<boolean>(post.likes && post.likes.length > 0 ? true : false);
    const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
    const [isLiking, setIsLiking] = useState(false);

    // Repost State
    const [isReposted, setIsReposted] = useState(post.reposts && post.reposts.length > 0 ? true : false);
    const [repostCount, setRepostCount] = useState(post._count?.reposts || 0);

    // Comment State
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0);
    const [commentsList, setCommentsList] = useState<any[]>(post.comments || []);
    const [isCommenting, setIsCommenting] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [isPinned, setIsPinned] = useState(post.is_pinned || false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const isOwner = user?.id === post.user.id;

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);

        if (onLike) onLike(post.id, liked ? -1 : 1);

        try {
            await api.post(`/posts/${post.id}/like`);
        } catch (error) {
            setLiked(liked);
            setLikesCount(prev => liked ? prev + 1 : prev - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleRepost = async () => {
        setIsReposted(!isReposted);
        setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
        try {
            await api.post(`/posts/${post.id}/repost`);
        } catch (err) {
            // silent fail for optimistic
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || isCommenting) return;
        setIsCommenting(true);
        try {
            const res = await api.post(`/posts/${post.id}/comments`, { content: commentText });
            setCommentsCount(prev => prev + 1);
            setCommentsList(prev => [...prev, res.data]);
            setCommentText('');
            // Do not hide form: setShowCommentForm(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${post.id}`);
            setIsDeleted(true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditSave = async () => {
        if (!editedContent.trim()) return;
        try {
            await api.put(`/posts/${post.id}`, { content: editedContent });
            setIsEditing(false);
            post.content = editedContent;
        } catch (error) {
            console.error(error);
        }
    };

    const handlePin = async () => {
        try {
            const res = await api.post(`/posts/${post.id}/pin`);
            setIsPinned(res.data.post.is_pinned);
            setIsMenuOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    if (isDeleted) return null;

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            className="p-5 border-b border-border hover:bg-white/[0.01] transition-colors"
        >
            <div className="flex gap-4">
                <Link href={`/profile/${post.user.username}`} className="flex-shrink-0">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={post.user.avatar || '/default-avatar.png'} />
                        <AvatarFallback className="bg-secondary text-primary">{post.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    {isPinned && (
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground mb-1">
                            <Pin className="w-3 h-3 fill-current" />
                            <span>Pinned</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <Link href={`/profile/${post.user.username}`} className="group flex items-center gap-2">
                            <span className="font-bold text-white group-hover:underline">{post.user.username}</span>
                            <span className="text-muted-foreground text-sm">
                                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                        </Link>
                        {isOwner && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="text-muted-foreground hover:text-cyan-400 p-1 rounded-full transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute right-0 top-6 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 py-1"
                                        >
                                            <button onClick={handlePin} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-white hover:bg-white/5 transition-colors font-semibold">
                                                <Pin className="w-4 h-4" />
                                                {isPinned ? 'Unpin from profile' : 'Pin to profile'}
                                            </button>
                                            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-white hover:bg-white/5 transition-colors font-semibold">
                                                <Edit className="w-4 h-4" />
                                                Edit post
                                            </button>
                                            <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-red-500 hover:bg-white/5 transition-colors font-semibold">
                                                <Trash className="w-4 h-4" />
                                                Delete post
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-2 space-y-3">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-3 text-[15px] text-white outline-none focus:border-cyan-500 transition-colors resize-none min-h-[100px]"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedContent(post.content); }} className="h-8 rounded-full hover:bg-white/5">
                                    <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleEditSave} className="h-8 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white">
                                    <Check className="w-4 h-4 mr-1" /> Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 text-[15px] text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
                            {post.content}
                        </div>
                    )}

                    {post.media_url && (
                        <div
                            className="mt-3 relative rounded-2xl overflow-hidden border border-border bg-black/40 group cursor-pointer"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.media_url} alt="Post media" className="w-full h-auto max-h-[500px] object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <span className="text-white font-bold bg-black/60 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl border border-white/10">
                                    <Search className="w-4 h-4" /> Lihat Gambar
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between max-w-md pr-12 text-muted-foreground">
                        <button
                            onClick={() => setShowCommentForm(!showCommentForm)}
                            className={`flex items-center gap-2 group transition-colors ${showCommentForm ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
                        >
                            <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm">{commentsCount}</span>
                        </button>

                        <button
                            onClick={handleRepost}
                            className={`flex items-center gap-2 group transition-colors ${isReposted ? 'text-green-400' : 'hover:text-green-400'}`}
                        >
                            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                                <Repeat2 className="w-4 h-4" />
                            </div>
                            <span className="text-sm">{repostCount}</span>
                        </button>

                        <button
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`flex items-center gap-2 group transition-colors ${liked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                        >
                            <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                                <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
                            </div>
                            <span className="text-sm">{likesCount}</span>
                        </button>

                        <button className="flex items-center gap-2 group hover:text-cyan-400 transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors">
                                <Share className="w-4 h-4" />
                            </div>
                        </button>
                    </div>

                    <AnimatePresence>
                        {showCommentForm && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 flex gap-3 items-center overflow-hidden"
                            >
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.avatar || '/default-avatar.png'} />
                                    <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <input
                                    className="flex-1 bg-transparent border-b border-white/20 focus:border-cyan-500 pb-1 outline-none text-sm text-white placeholder:text-muted-foreground transition-colors"
                                    placeholder="Post your reply..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleCommentSubmit}
                                    disabled={!commentText.trim() || isCommenting}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full h-8 w-8 p-0"
                                >
                                    <Send className="w-4 h-4 -ml-0.5" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Inline Comments */}
                    {commentsList.length > 0 && showCommentForm && (
                        <div className="mt-4 space-y-3 pl-4 border-l border-white/10">
                            {commentsList.map((comment: any, i: number) => (
                                <InlineComment key={comment.id || i} comment={comment} post_id={post.id} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isLightboxOpen && post.media_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 rounded-full p-2 hover:bg-white/10 transition-colors z-[101]"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={post.media_url}
                            alt="Post media full"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

function InlineComment({ comment, post_id }: { comment: any, post_id: string }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const handleCommentLike = async () => {
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        try {
            await api.post(`/posts/${post_id}/comments/${comment.id}/like`);
        } catch (err) {
            // silent fail
            setLiked(liked);
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-start"
        >
            <Avatar className="w-6 h-6 mt-1 shrink-0">
                <AvatarImage src={comment.user?.avatar || '/default-avatar.png'} />
                <AvatarFallback className="text-[10px]">{comment.user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex justify-between items-start bg-white/[0.03] rounded-2xl px-3 py-2">
                <div className="flex-1 pr-3">
                    <span className="text-[13px] font-bold text-white mr-2">{comment.user?.username}</span>
                    <span className="text-[13px] text-white/90">{comment.content}</span>
                </div>
                <div className="flex flex-col items-end gap-1 mt-0.5 shrink-0">
                    <button
                        onClick={handleCommentLike}
                        className={`flex items-center gap-1 text-[11px] font-semibold ${liked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500 transition-colors'}`}
                    >
                        {likeCount > 0 && <span>{likeCount}</span>}
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-[9px] text-muted-foreground/70 font-medium tracking-wide">
                        {comment.created_at ? formatDistanceToNow(new Date(comment.created_at)) : 'just now'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
