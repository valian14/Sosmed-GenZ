"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { SearchIcon, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';

export default function MessagesPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await api.get('/messages/conversations');
                setConversations(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchConversations();
    }, []);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        const search = async () => {
            setIsSearching(true);
            try {
                const res = await api.get(`/users/search?q=${debouncedQuery}`);
                setSearchResults(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };
        search();
    }, [debouncedQuery]);

    return (
        <div className="w-full flex md:border-x border-border min-h-screen flex-col pt-4 md:pt-6">
            <div className="px-6 pb-4 border-b border-white/5 sticky top-0 md:static z-20 bg-background/80 backdrop-blur-md">
                <h1 className="text-xl font-bold gradient-text mb-4">Messages</h1>

                <div className="relative mb-2">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for people..."
                        className="pl-10 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-full h-11 text-[15px]"
                    />
                </div>
            </div>

            <div className="flex flex-col">
                {query.trim().length > 0 ? (
                    isSearching ? (
                        <div className="p-8 text-center text-muted-foreground">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map(u => (
                            <Link
                                key={u.id}
                                href={`/messages/${u.id}`}
                                className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-4 items-center"
                            >
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={u.avatar || '/default-avatar.png'} />
                                    <AvatarFallback>{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-white truncate">{u.username}</span>
                                    <p className="text-sm text-muted-foreground truncate">{u.bio || 'Say hi 👋'}</p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">No users found.</div>
                    )
                ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No messages yet. Slide into someone's DMs! 🚀
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <Link
                            key={conv.partner.id}
                            href={`/messages/${conv.partner.id}`}
                            className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-4 items-center"
                        >
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={conv.partner.avatar || '/default-avatar.png'} />
                                <AvatarFallback>{conv.partner.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-white truncate">{conv.partner.username}</span>
                                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {conv.lastMessage.sender_id === conv.partner.id ? '' : 'You: '}
                                    {conv.lastMessage.content}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
