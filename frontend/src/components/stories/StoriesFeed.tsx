"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUiStore from '@/store/useUiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, SendHorizontal, Eye } from 'lucide-react';
import useSocketStore from '@/store/useSocketStore';
import { useToast } from '@/hooks/use-toast';

export default function StoriesFeed() {
    const [storyGroups, setStoryGroups] = useState<any[]>([]);
    const { user } = useAuthStore();
    const { openComposeStory } = useUiStore();
    const [activeGroup, setActiveGroup] = useState<any>(null);
    const { socket } = useSocketStore();
    const [flyingHearts, setFlyingHearts] = useState<{ id: number }[]>([]);
    const [replyText, setReplyText] = useState('');
    const [showActivity, setShowActivity] = useState(false);
    const [activityTab, setActivityTab] = useState<'views' | 'likes'>('views');
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!socket) return;

        const handleStoryLike = () => {
            const id = Date.now() + Math.random();
            setFlyingHearts(prev => [...prev, { id }]);
            setTimeout(() => setFlyingHearts(prev => prev.filter(h => h.id !== id)), 2000);
        };

        socket.on('story_like', handleStoryLike);
        return () => { socket.off('story_like', handleStoryLike); }
    }, [socket]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !activeGroup) return;
        try {
            await api.post(`/messages/${activeGroup.user.id}`, { content: `(Membalas Story): ${replyText}` });
            toast({ title: 'Terkirim', description: `Satu pesan telah dikirim ke ${activeGroup.user.username}` });
            setReplyText('');
            const targetUserId = activeGroup.user.id;
            setActiveGroup(null);
            router.push(`/messages/${targetUserId}`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLikeStory = async () => {
        if (!activeGroup || !socket) return;
        const currentStory = activeGroup.stories[activeGroup.stories.length - 1];
        const isCurrentlyLiked = currentStory.likes?.some((l: any) => l.user.id === user?.id);

        const toggleLocalState = (isLiked: boolean) => {
            const updatedGroup = (g: any) => ({
                ...g,
                stories: g.stories.map((s: any) => s.id === currentStory.id ? {
                    ...s,
                    likes: isLiked
                        ? [...(s.likes || []), { user: { id: user?.id, username: user?.username, avatar: user?.avatar } }]
                        : (s.likes || []).filter((l: any) => l.user.id !== user?.id)
                } : s)
            });
            setStoryGroups(prev => prev.map(g => g.user.id === activeGroup.user.id ? updatedGroup(g) : g));
            setActiveGroup((prev: any) => prev ? updatedGroup(prev) : null);
        };

        // Optimistically toggle UI instantly
        toggleLocalState(!isCurrentlyLiked);
        if (!isCurrentlyLiked) {
            socket.emit('story_like', { receiverId: activeGroup.user.id });
            const id = Date.now() + Math.random();
            setFlyingHearts(prev => [...prev, { id }]);
            setTimeout(() => setFlyingHearts(prev => prev.filter(h => h.id !== id)), 2000);
        }

        try { await api.post(`/stories/${currentStory.id}/like`); }
        catch (e) {
            console.error(e);
            toggleLocalState(isCurrentlyLiked); // Revert on failure
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!activeGroup) return;
        const currentStory = activeGroup.stories[activeGroup.stories.length - 1];

        if (activeGroup.user.id !== user?.id) {
            const hasViewed = currentStory.views?.some((v: any) => v.user.id === user?.id);
            if (!hasViewed) {
                // Tracking API
                api.post(`/stories/${currentStory.id}/view`).catch(e => console.error(e));

                // Optimistically mark as viewed for Grey Ring UI
                const updatedGroup = (g: any) => ({
                    ...g,
                    stories: g.stories.map((s: any) => s.id === currentStory.id ? {
                        ...s,
                        views: [...(s.views || []), { user: { id: user?.id, username: user?.username, avatar: user?.avatar } }]
                    } : s)
                });
                setStoryGroups(prev => prev.map(g => g.user.id === activeGroup.user.id ? updatedGroup(g) : g));
                setActiveGroup((prev: any) => prev ? updatedGroup(prev) : null);
            }
        } else {
            // Story Intro Animation if likes exist
            if (currentStory.likes?.length > 0) {
                const newHearts = Array.from({ length: 4 }).map((_, i) => ({ id: Date.now() + i }));
                setFlyingHearts(prev => [...prev, ...newHearts]);
                setTimeout(() => setFlyingHearts(prev => prev.filter(h => !newHearts.find(n => n.id === h.id))), 2500);
            }
        }
    }, [activeGroup, user?.id]);

    useEffect(() => {
        setMounted(true);
        const fetchStories = async () => {
            try {
                const res = await api.get('/stories');
                setStoryGroups(res.data);
            } catch (e) { console.error(e); }
        }
        fetchStories();
    }, []);

    const myStoryGroup = storyGroups.find(g => g.user.id === user?.id);
    const otherStories = storyGroups.filter(g => g.user.id !== user?.id);

    return (
        <>
            <div className="flex overflow-x-auto gap-5 pb-4 pt-1 px-1 no-scrollbar items-center mb-6 border-b border-border">
                {/* Native Create/View Story Bubble */}
                <div className="flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer group" onClick={() => myStoryGroup ? setActiveGroup(myStoryGroup) : openComposeStory()}>
                    <div className={`relative rounded-full p-[2.5px] transition-all drop-shadow-md ${myStoryGroup ? 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 hover:opacity-80' : 'bg-border group-hover:bg-cyan-500'}`}>
                        <Avatar className="w-[60px] h-[60px] border-2 border-background">
                            <AvatarImage src={user?.avatar || '/default-avatar.png'} className="object-cover" />
                            <AvatarFallback className="bg-muted text-muted-foreground">{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {!myStoryGroup && (
                            <div className="absolute bottom-0 right-0 bg-cyan-500 rounded-full border-[2.5px] border-background p-0.5">
                                <Plus className="w-3.5 h-3.5 text-white font-bold" />
                            </div>
                        )}
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-white transition-colors font-medium truncate max-w-[72px] text-center tracking-wide">Your Story</span>
                </div>

                {/* Dynamic Users */}
                {otherStories.map((group, idx) => {
                    const isRead = group.stories.every((s: any) => s.views?.some((v: any) => v.user.id === user?.id));
                    return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveGroup(group)}>
                            <div className={`relative rounded-full p-[2.5px] ${isRead ? 'bg-neutral-600' : 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 drop-shadow-md'}`}>
                                <Avatar className="w-[60px] h-[60px] border-2 border-background">
                                    <AvatarImage src={group.user.avatar || '/default-avatar.png'} className="object-cover" />
                                    <AvatarFallback>{group.user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            <span className="text-[11px] text-white font-medium truncate max-w-[72px] text-center tracking-wide">{group.user.username}</span>
                        </div>
                    );
                })}
            </div>

            {mounted && createPortal(
                <AnimatePresence>
                    {activeGroup && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setActiveGroup(null)}>
                            {/* Popup Story Wrapper */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-[400px] aspect-[9/16] md:h-[90vh] flex items-center justify-center bg-neutral-950 rounded-2xl md:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={() => setActiveGroup(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-[110] bg-black/40 hover:bg-black/80 p-2 rounded-full backdrop-blur-sm"><X className="w-5 h-5" /></button>

                                {activeGroup.stories[activeGroup.stories.length - 1].media_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={activeGroup.stories[activeGroup.stories.length - 1].media_url} className="w-full h-full object-cover" alt="Story" />
                                ) : (
                                    <h2 className="text-2xl text-white font-bold px-8 text-center leading-relaxed tracking-wide drop-shadow-lg">{activeGroup.stories[activeGroup.stories.length - 1].content}</h2>
                                )}

                                {/* Floating Hearts Animation */}
                                {flyingHearts.map(h => (
                                    <motion.div
                                        key={h.id}
                                        initial={{ opacity: 1, y: 100, x: (Math.random() - 0.5) * 40, scale: 0.5 }}
                                        animate={{ opacity: 0, y: -250, scale: 1.5 }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="absolute bottom-20 right-10 z-[120] pointer-events-none"
                                    >
                                        <Heart className="w-10 h-10 text-pink-500 fill-pink-500 drop-shadow-2xl" />
                                    </motion.div>
                                ))}

                                {/* Overlay Header */}
                                <div className="absolute top-0 left-0 right-0 p-4 pt-5 bg-gradient-to-b from-black/80 to-transparent flex gap-3 items-center z-10 pointer-events-none">
                                    <Avatar className="w-9 h-9 border border-white/20 shadow-lg">
                                        <AvatarImage src={activeGroup.user.avatar} className="object-cover" />
                                        <AvatarFallback className="text-xs bg-neutral-800">{activeGroup.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-white font-bold text-sm tracking-wide drop-shadow-md">{activeGroup.user.username}</span>
                                    <span className="text-white/50 text-xs font-semibold ml-auto pr-10">2h</span>
                                </div>

                                {/* Overlay Footer */}
                                {activeGroup.user.id !== user?.id ? (
                                    <>
                                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 flex gap-3 items-center z-20">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                                    placeholder={`Balas ${activeGroup.user.username}...`}
                                                    className="w-full bg-black/40 border border-white/20 text-white text-sm rounded-full px-5 py-3 focus:outline-none focus:bg-black/60 focus:border-white/40 backdrop-blur-md placeholder:text-white/60 transition-all pr-12"
                                                />
                                                <button
                                                    onClick={handleSendReply}
                                                    disabled={!replyText.trim()}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors group disabled:opacity-50 disabled:hover:bg-transparent text-white"
                                                >
                                                    <SendHorizontal className="w-5 h-5 group-hover:translate-x-0.5 transition-transform text-white/80" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleLikeStory}
                                                className="p-3 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 transition-all group overflow-hidden relative active:scale-95"
                                            >
                                                <Heart className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeGroup.stories[activeGroup.stories.length - 1].likes?.some((l: any) => l.user.id === user?.id) ? 'text-pink-500 fill-pink-500' : 'text-white group-hover:text-pink-500'}`} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <button
                                            onClick={() => setShowActivity(!showActivity)}
                                            className="flex items-center gap-3 p-2 px-3 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 transition-all text-white"
                                        >
                                            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                                <Eye className="w-4 h-4 text-white" />
                                                <span className="text-sm font-bold text-white">{activeGroup.stories[activeGroup.stories.length - 1].views?.length || 0}</span>
                                            </div>
                                            <div className="w-[1px] h-4 bg-white/20" />
                                            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                                                <span className="text-sm font-bold text-pink-500">{activeGroup.stories[activeGroup.stories.length - 1].likes?.length || 0}</span>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {showActivity && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                    className="absolute bottom-[120%] left-0 mb-2 bg-black/80 backdrop-blur-md rounded-xl p-3 min-w-[200px] border border-white/10 shadow-xl"
                                                >
                                                    <div className="flex justify-between items-center mb-3 px-1 border-b border-white/10 pb-2">
                                                        <div className="flex gap-4">
                                                            <span onClick={(e) => { e.stopPropagation(); setActivityTab('views'); }} className={`text-xs font-bold cursor-pointer transition-colors ${activityTab === 'views' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>Dilihat</span>
                                                            <span onClick={(e) => { e.stopPropagation(); setActivityTab('likes'); }} className={`text-xs font-bold cursor-pointer transition-colors ${activityTab === 'likes' ? 'text-pink-500' : 'text-white/40 hover:text-white/80'}`}>Disukai</span>
                                                        </div>
                                                        <X className="w-3 h-3 text-white/60 cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); setShowActivity(false); }} />
                                                    </div>
                                                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto w-full no-scrollbar">
                                                        {(activityTab === 'views'
                                                            ? activeGroup.stories[activeGroup.stories.length - 1].views || []
                                                            : activeGroup.stories[activeGroup.stories.length - 1].likes || []
                                                        ).map((item: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <Avatar className="w-6 h-6 border border-white/10">
                                                                    <AvatarImage src={item.user.avatar} className="object-cover" />
                                                                    <AvatarFallback className="text-[10px] text-white bg-neutral-700">{item.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-white text-xs truncate max-w-[120px]">{item.user.username}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                , document.body)}
        </>
    )
}
