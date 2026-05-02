"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Heart, UserPlus, MessageCircle, Repeat2 } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data);
                await api.put('/notifications/read');
            } catch (err) {
                console.error(err);
            }
        };
        fetchNotifs();
    }, []);

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'follow': return <UserPlus className="w-5 h-5 text-cyan-500" />;
            case 'like': return <Heart className="w-5 h-5 text-pink-500 fill-current" />;
            case 'comment': return <MessageCircle className="w-5 h-5 text-green-500" />;
            case 'repost': return <Repeat2 className="w-5 h-5 text-green-500" />;
            default: return null;
        }
    };

    return (
        <div className="w-full flex md:border-x border-border min-h-screen flex-col pt-4 md:pt-6">
            <div className="px-6 pb-4 border-b border-white/5 sticky top-0 md:static z-20 bg-background/80 backdrop-blur-md">
                <h1 className="text-xl font-bold gradient-text">Notifications</h1>
            </div>

            <div className="flex flex-col">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No notifications yet. You're all caught up! ✨
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <Link
                            key={notif.id}
                            href={notif.type === 'follow' ? `/profile/${notif.actor.username}` : `/post/${notif.reference_id || ''}`}
                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-4 ${!notif.is_read ? 'bg-cyan-500/5' : ''}`}
                        >
                            <div className="pt-1">{getIcon(notif.type)}</div>
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={notif.actor.avatar || '/default-avatar.png'} />
                                <AvatarFallback>{notif.actor.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="text-[15px]">
                                    <span className="font-bold text-white hover:underline">{notif.actor.username}</span>
                                    <span className="text-muted-foreground ml-1">
                                        {notif.type.toLowerCase() === 'follow' && 'mulai mengikuti Anda'}
                                        {notif.type.toLowerCase() === 'like' && 'menyukai postingan Anda'}
                                        {notif.type.toLowerCase() === 'comment' && 'mengomentari postingan Anda'}
                                        {notif.type.toLowerCase() === 'repost' && 'me-repost postingan Anda'}
                                        {notif.type.toLowerCase() === 'comment_like' && 'menyukai komentar Anda'}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
