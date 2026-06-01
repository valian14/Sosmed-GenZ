"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import usePostStore from '@/store/usePostStore';
import useAuthStore from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Feed() {
    const { user } = useAuthStore();
    const { newPosts, uploadingPosts, clearNewPosts } = usePostStore();
    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/posts/feed?page=${page}`);
                if (res.data.length === 0) setHasMore(false);
                setPosts(prev => page === 1 ? res.data : [...prev, ...res.data]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [page]);

    useEffect(() => {
        if (newPosts.length > 0) {
            setPosts(prev => {
                const uniqueNewPosts = newPosts.filter(np => !prev.find(p => p.id === np.id));
                return [...uniqueNewPosts, ...prev];
            });
            clearNewPosts();
        }
    }, [newPosts, clearNewPosts]);

    return (
        <div className="flex flex-col w-full pb-20">
            <AnimatePresence>
                {uploadingPosts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-border p-4 bg-card/10 overflow-hidden"
                    >
                        <div className="flex gap-4">
                            <Avatar className="w-12 h-12 opacity-50 grayscale">
                                <AvatarImage src={user?.avatar || '/default-avatar.png'} />
                                <AvatarFallback>{user?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="font-bold text-white/50">{user?.username} <span className="text-xs font-normal">Memuat postingan...</span></div>
                                <p className="text-white/70">{post.content}</p>
                                {post.media_url && (
                                    <div className="mt-2 w-full max-w-sm h-32 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                                        <span className="text-white/30 text-xs">Processing media...</span>
                                    </div>
                                )}
                                <div className="w-full bg-white/5 h-1.5 mt-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                        style={{ width: `${post.progress}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-cyan-400 text-right mt-1 font-medium">
                                    {Math.round(post.progress)}%
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {posts.map((post, index) => {
                    if (posts.length === index + 1) {
                        return <div ref={lastPostElementRef} key={post.id}><PostCard post={post} /></div>;
                    }
                    return <PostCard key={post.id} post={post} />;
                })}
            </AnimatePresence>

            {loading && (
                <div className="p-6 space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <div className="text-center p-8 text-muted-foreground text-sm">
                    You've caught up! No more posts to show.
                </div>
            )}
        </div>
    );
}
