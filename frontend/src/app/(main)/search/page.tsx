"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchIcon, UserPlus, Check } from "lucide-react";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { useDebounce } from "use-debounce";

export default function SearchPage() {
    const { user } = useAuthStore();
    const [query, setQuery] = useState("");
    const [debouncedQuery] = useDebounce(query, 500);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get(`/users/search?q=${debouncedQuery}`);
                // filter out self if needed, but the api can do it
                setResults(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [debouncedQuery]);

    const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
        try {
            await api.post(`/users/${userId}/follow`);
            setResults((prev) => prev.map(u => {
                if (u.id === userId) {
                    return { ...u, isFollowing: !isFollowing };
                }
                return u;
            }));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col md:border-x border-border pt-4 md:pt-6">
            <div className="px-6 pb-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-20">
                <h1 className="text-xl font-bold gradient-text mb-4">Search Friends</h1>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for usernames... (e.g., jauza)"
                        className="pl-10 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-full h-12 text-[15px]"
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col p-2">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">Searching...</div>
                ) : results.length > 0 ? (
                    results.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors">
                            <Link href={`/profile/${u.username}`} className="flex items-center gap-3 flex-1">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={u.avatar || "/default-avatar.png"} />
                                    <AvatarFallback>{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-white text-[15px] hover:underline">{u.username}</p>
                                    <p className="text-muted-foreground text-sm line-clamp-1">{u.bio || "No bio yet."}</p>
                                </div>
                            </Link>

                            {user?.id !== u.id && (
                                <Button
                                    onClick={() => handleFollowToggle(u.id, u.isFollowing)}
                                    variant={u.isFollowing ? "outline" : "default"}
                                    size="sm"
                                    className={`rounded-full px-5 font-bold transition-all ${u.isFollowing
                                            ? 'border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500'
                                            : 'bg-white text-black hover:bg-white/90'
                                        }`}
                                >
                                    {u.isFollowing ? (
                                        <>Following</>
                                    ) : (
                                        <>Follow</>
                                    )}
                                </Button>
                            )}
                        </div>
                    ))
                ) : debouncedQuery ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No username matching "{debouncedQuery}".
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        Find people you know on GenZ Social.
                    </div>
                )}
            </div>
        </div>
    );
}
