"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import PostCard from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence } from 'framer-motion';

export default function Feed() {
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

    return (
        <div className="flex flex-col w-full pb-20">
            <AnimatePresence>
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
