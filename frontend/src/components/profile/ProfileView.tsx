"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, MapPin, Calendar, Link as LinkIcon, Edit3, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../feed/PostCard';

export default function ProfileView({ username }: { username: string }) {
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [likedPosts, setLikedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false); // optimistic toggle

    const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
    const [networkType, setNetworkType] = useState<'followers' | 'following'>('followers');
    const [networkUsers, setNetworkUsers] = useState<any[]>([]);
    const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);

    const [editForm, setEditForm] = useState<{ bio: string, avatar: string, banner: string, links: string[] }>({ bio: '', avatar: '', banner: '', links: [] });

    const openNetworkModal = async (type: 'followers' | 'following') => {
        setNetworkType(type);
        setIsNetworkModalOpen(true);
        setNetworkUsers([]);
        try {
            const res = await api.get(`/users/${username}/${type}`);
            setNetworkUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFollow = async () => {
        setIsFollowing(!isFollowing);
        try {
            await api.post(`/users/${profile.id}/follow`);
        } catch (error) {
            console.error(error);
            setIsFollowing(isFollowing); // revert
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [profRes, postsRes, likesRes] = await Promise.all([
                    api.get(`/users/${username}`),
                    api.get(`/users/${username}/posts`),
                    api.get(`/users/${username}/likes`)
                ]);
                setProfile(profRes.data);
                let parseLinks = [];
                try { parseLinks = typeof profRes.data.links === 'string' ? JSON.parse(profRes.data.links) : (profRes.data.links || []); } catch { }
                if (!Array.isArray(parseLinks)) parseLinks = [];
                profRes.data.links = parseLinks;
                setEditForm({ bio: profRes.data.bio || '', avatar: profRes.data.avatar || '', banner: profRes.data.banner || '', links: parseLinks });
                setPosts(postsRes.data);
                setLikedPosts(likesRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [username]);

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading identity...</div>;
    if (!profile) return <div className="p-8 text-center">User not found</div>;

    const isMe = currentUser?.username === username;

    const optimizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 800;

                    if (width > height && width > maxDim) {
                        height = Math.round(height * maxDim / width);
                        width = maxDim;
                    } else if (height > maxDim) {
                        width = Math.round(width * maxDim / height);
                        height = maxDim;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const optimizedBase64 = await optimizeImage(file);
            setEditForm(prev => ({ ...prev, [field]: optimizedBase64 }));
        }
    };

    const handleSaveProfile = async () => {
        try {
            const payload = { ...editForm, links: editForm.links.filter(l => l.trim() !== '') };
            await api.put('/users', payload);
            setProfile((prev: any) => ({ ...prev, bio: payload.bio, avatar: payload.avatar, banner: payload.banner, links: payload.links }));
            setEditForm(payload);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full min-h-screen border-x border-border"
        >
            {/* Banner */}
            <div className="h-48 w-full bg-secondary relative overflow-hidden group">
                <input type="file" id="bannerCover" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} disabled={!isEditing} />
                {profile.banner || editForm.banner ? (
                    <img src={isEditing ? editForm.banner : profile.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-cyan-900/50 to-purple-900/50" />
                )}
                {isEditing && (
                    <label
                        htmlFor="bannerCover"
                        className="absolute bottom-4 right-4 bg-black/70 p-3 rounded-full text-white cursor-pointer hover:bg-black/90 transition-all backdrop-blur-sm"
                    >
                        <Camera className="w-5 h-5" />
                    </label>
                )}
            </div>

            {/* Info Section */}
            <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-start">
                    <div className="relative -mt-16 w-32 h-32 ring-4 ring-background bg-secondary rounded-full z-10 group/avatar inline-block">
                        <Avatar className="w-full h-full border-none">
                            <AvatarImage src={(isEditing ? editForm.avatar : profile.avatar) || '/default-avatar.png'} className="object-cover" />
                            <AvatarFallback className="text-4xl">{profile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <label htmlFor="avatarPhoto" className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Edit Photo</span>
                                <input type="file" id="avatarPhoto" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                            </label>
                        )}
                    </div>

                    <div className="pt-4 flex gap-2">
                        {isMe ? (
                            isEditing ? (
                                <>
                                    <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-full border-border bg-transparent text-white hover:bg-white/5">Cancel</Button>
                                    <Button onClick={handleSaveProfile} className="rounded-full font-bold bg-white text-black hover:bg-white/90">Save</Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="outline"
                                    className="rounded-full font-bold border-border bg-transparent text-white hover:bg-white/5"
                                >
                                    Edit Profile
                                </Button>
                            )
                        ) : (
                            <Button
                                onClick={handleFollow}
                                className={`rounded-full font-bold min-w-[120px] transition-all ${isFollowing ? 'border bg-transparent border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500' : 'bg-cyan-500 hover:bg-cyan-600 text-white'}`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-4 space-y-1">
                    <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                </div>

                {isEditing ? (
                    <div className="mt-4 space-y-3">
                        <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm min-h-[80px] focus:outline-none focus:border-cyan-500"
                            placeholder="Write something cool about yourself..."
                            maxLength={160}
                        />
                        {editForm.links.map((lnk, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={lnk}
                                        onChange={(e) => {
                                            const updated = [...editForm.links];
                                            updated[index] = e.target.value;
                                            setEditForm(prev => ({ ...prev, links: updated }));
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                                        placeholder="Website or Social Link"
                                    />
                                </div>
                                <Button
                                    onClick={() => setEditForm(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }))}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-300 hover:bg-white/5 shrink-0 h-9 w-9"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            onClick={() => setEditForm(prev => ({ ...prev, links: [...prev.links, ''] }))}
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-dashed border-white/20 text-muted-foreground hover:text-white mt-2"
                        >
                            + Add Link
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="mt-4 text-white/90 whitespace-pre-wrap leading-relaxed">
                            {profile.bio || "This user hasn't set up a bio yet. Big mysterious energy. ✨"}
                        </div>
                        {profile.links && profile.links.length > 0 && (
                            <div className="mt-3">
                                {profile.links.length === 1 ? (
                                    <a href={profile.links[0].startsWith('http') ? profile.links[0] : `https://${profile.links[0]}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium w-max">
                                        <LinkIcon className="w-4 h-4" />
                                        {profile.links[0].replace(/^https?:\/\//, '')}
                                    </a>
                                ) : (
                                    <button onClick={() => setIsLinksModalOpen(true)} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium w-max">
                                        <LinkIcon className="w-4 h-4" />
                                        {profile.links[0].replace(/^https?:\/\//, '')} dan {profile.links.length - 1} lainnya
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1.5 focus:text-white">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                    </div>
                </div>

                <div className="mt-6 flex gap-6 text-sm">
                    <button onClick={() => openNetworkModal('following')} className="hover:underline flex gap-1.5 focus:outline-none">
                        <span className="font-bold text-white">{profile._count.following}</span>
                        <span className="text-muted-foreground">Following</span>
                    </button>
                    <button onClick={() => openNetworkModal('followers')} className="hover:underline flex gap-1.5 focus:outline-none">
                        <span className="font-bold text-white">{profile._count.followers}</span>
                        <span className="text-muted-foreground">Followers</span>
                    </button>
                </div>
            </div>

            {/* Tabs / Feed Space */}
            <div className="border-b border-border flex">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 font-bold py-4 transition-colors ${activeTab === 'posts' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    Posts
                </button>
                <button
                    onClick={() => setActiveTab('likes')}
                    className={`flex-1 font-bold py-4 transition-colors ${activeTab === 'likes' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    Likes
                </button>
            </div>

            <div className="flex-1 flex flex-col">
                <AnimatePresence mode="popLayout">
                    {activeTab === 'posts' && (
                        posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                No posts yet. Time to share a vibe! ✨
                            </div>
                        )
                    )}
                    {activeTab === 'likes' && (
                        likedPosts.length > 0 ? (
                            likedPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                This user hasn't liked any posts yet. 🕵️
                            </div>
                        )
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {isNetworkModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setIsNetworkModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white capitalize">{networkType}</h3>
                                <button onClick={() => setIsNetworkModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-2 max-h-[50vh] overflow-y-auto">
                                {networkUsers.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">No {networkType} yet.</div>
                                ) : (
                                    networkUsers.map(u => (
                                        <Link key={u.id} href={`/profile/${u.username}`} onClick={() => setIsNetworkModalOpen(false)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={u.avatar || '/default-avatar.png'} />
                                                <AvatarFallback>{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{u.username}</div>
                                                <div className="text-xs text-muted-foreground truncate">{u.bio || 'GenZ vibing...'}</div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {isLinksModalOpen && profile.links && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setIsLinksModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Links</h3>
                                <button onClick={() => setIsLinksModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-2 max-h-[50vh] overflow-y-auto">
                                {profile.links.map((lnk: string, i: number) => (
                                    <a key={i} href={lnk.startsWith('http') ? lnk : `https://${lnk}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                            <LinkIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0 font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                                            {lnk.replace(/^https?:\/\//, '')}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
