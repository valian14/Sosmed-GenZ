"use client";

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
// Note: Normally we'd use useSocketStore here if we set one up

export default function ChatRoomPage({ params }: { params: { userId: string } }) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [partner, setPartner] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchChat = async () => {
            try {
                // Fetch partner details by explicitly calling the new ID-based endpoint
                const partnerRes = await api.get(`/users/id/${params.userId}`);
                setPartner(partnerRes.data);

                const msgRes = await api.get(`/messages/${params.userId}`);
                setMessages(msgRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchChat();

        // Mock socket logic - assuming a global socket connection is handled elsewhere or later
        const interval = setInterval(() => {
            // Polling as a fallback if real sockets aren't hooked up on the frontend context yet
            api.get(`/messages/${params.userId}`).then(res => setMessages(res.data)).catch(console.error);
        }, 5000);

        return () => clearInterval(interval);
    }, [params.userId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!content.trim()) return;
        const msg = content;
        setContent('');
        const optimisticMsg = {
            id: Date.now().toString(),
            sender_id: user?.id,
            receiver_id: params.userId,
            content: msg,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);
        try {
            const res = await api.post(`/messages/${params.userId}`, { content: msg });
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? res.data : m));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full flex md:border-x border-border min-h-[100dvh] flex-col bg-background relative h-screen">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 sticky top-0 z-20 bg-background/90 backdrop-blur-md flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" asChild>
                    <Link href="/messages">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={partner?.avatar || '/default-avatar.png'} />
                        <AvatarFallback>{partner?.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-bold text-white leading-tight">{partner?.username || 'Loading...'}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground my-8 text-sm">
                        Start the conversation! Say hi 👋
                    </div>
                ) : (
                    messages.map((m) => {
                        const isMe = m.sender_id === user?.id;
                        return (
                            <div key={m.id} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-[15px] ${isMe ? 'bg-cyan-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                                    {m.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Box */}
            <div className="fixed md:absolute bottom-0 w-full md:w-auto left-0 right-0 p-3 bg-background border-t border-white/10">
                <AnimatePresence>
                    {showEmoji && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-full left-4 mb-2 z-50 rounded-xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            <EmojiPicker
                                theme={Theme.DARK}
                                onEmojiClick={(em) => setContent(prev => prev + em.emoji)}
                                width={320}
                                height={380}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2 max-w-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className={`rounded-full flex-shrink-0 transition-colors w-12 h-12 ${showEmoji ? 'text-cyan-500 bg-white/10' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                    >
                        <Smile className="w-[22px] h-[22px]" />
                    </Button>
                    <input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        placeholder="Start a new message"
                        className="flex-1 bg-white/5 border border-transparent focus:border-cyan-500 rounded-full px-5 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-muted-foreground"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!content.trim()}
                        className="rounded-full w-12 h-12 bg-cyan-500 hover:bg-cyan-600 text-white flex-shrink-0 flex items-center justify-center p-0"
                    >
                        <Send className="w-5 h-5 -ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
