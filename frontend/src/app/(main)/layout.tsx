"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import useUiStore from '@/store/useUiStore';
import Link from 'next/link';
import { Home, User, MessageCircle, Bell, LogOut, Menu, Search, Gamepad2, Film, PlusSquare, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import ComposeBoxModal from '@/components/feed/ComposeBoxModal';
import ComposeStoryModal from '@/components/stories/ComposeStoryModal';

const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Create', isButton: true, icon: PlusSquare },
    { name: 'Game', href: '/game', icon: Gamepad2 },
    { name: 'Profile', href: '/profile/me', icon: User },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, logout, user } = useAuthStore();
    const { isComposePostOpen, isComposeStoryOpen, openComposePost, openComposeStory } = useUiStore();
    const [mounted, setMounted] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const createMenuRef = useRef<HTMLDivElement>(null);

    // Initialize global real-time socket
    useSocket();

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setIsCreateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!mounted || !isAuthenticated) return null;

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            logout();
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-border h-screen sticky top-0 bg-card/30 backdrop-blur-md">
                <div className="p-6">
                    <Link href="/home" className="text-2xl font-bold gradient-text tracking-tighter">GenZ Social</Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navigation.map((item) => {
                        if (item.isButton && item.name === 'Create') {
                            return (
                                <div key={item.name} className="relative" ref={createMenuRef}>
                                    <button
                                        onClick={() => setIsCreateOpen(!isCreateOpen)}
                                        className={`flex w-full items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isCreateOpen ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'hover:bg-white/5 text-muted-foreground hover:text-white'}`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isCreateOpen ? 'scale-110 shadow-cyan-500/50 drop-shadow-md' : 'group-hover:scale-110 transition-transform'}`} />
                                        {item.name}
                                    </button>

                                    <AnimatePresence>
                                        {isCreateOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10, y: 10 }}
                                                animate={{ opacity: 1, x: 0, y: 0 }}
                                                exit={{ opacity: 0, x: -10, y: 10 }}
                                                className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100] flex flex-col"
                                            >
                                                <button onClick={() => { setIsCreateOpen(false); openComposePost(); }} className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors text-left border-b border-border font-medium">
                                                    <FileText className="w-4 h-4 text-cyan-400" />
                                                    Post
                                                </button>
                                                <button onClick={() => { setIsCreateOpen(false); openComposeStory(); }} className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors text-left font-medium">
                                                    <ImageIcon className="w-4 h-4 text-pink-400" />
                                                    Story
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }

                        const isActive = item.href && pathname.startsWith(item.href !== '/profile/me' ? item.href : '/profile');
                        return (
                            <Link
                                key={item.name}
                                href={item.href === '/profile/me' && user ? `/profile/${user.username}` : (item.href || '#')}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'hover:bg-white/5 text-muted-foreground hover:text-white'}`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110 shadow-cyan-500/50 drop-shadow-md' : 'group-hover:scale-110 transition-transform'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground/80 font-medium">© 2026 EASJ Dev All rights reserved</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col pb-20 md:pb-0 min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                    <Link href="/home" className="text-xl font-bold gradient-text">GenZ Social</Link>
                </header>

                <div className="flex-1 w-full max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="min-h-[calc(100vh-160px)]"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>

                    {/* Mobile Footer */}
                    <div className="md:hidden w-full text-center py-8 opacity-60">
                        <p className="text-xs text-muted-foreground font-medium">© 2026 EASJ Dev All rights reserved</p>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border flex justify-around p-2 pb-6">
                {navigation.map((item) => {
                    if (item.isButton && item.name === 'Create') {
                        return (
                            <button
                                key={item.name}
                                onClick={() => setIsCreateOpen(!isCreateOpen)}
                                className={`p-3 rounded-full flex flex-col items-center gap-1 transition-colors ${isCreateOpen ? 'text-cyan-400' : 'text-muted-foreground'}`}
                            >
                                <item.icon className="w-6 h-6" />
                            </button>
                        );
                    }

                    const isActive = item.href && pathname.startsWith(item.href !== '/profile/me' ? item.href : '/profile');
                    return (
                        <Link
                            key={item.name}
                            href={item.href === '/profile/me' && user ? `/profile/${user.username}` : (item.href || '#')}
                            className={`p-3 rounded-full flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-muted-foreground'}`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}`} />
                        </Link>
                    );
                })}
            </nav>

            {/* Global Modals Mounted at Root */}
            <AnimatePresence>
                {isComposePostOpen && <ComposeBoxModal key="post" />}
                {isComposeStoryOpen && <ComposeStoryModal key="story" />}
            </AnimatePresence>
        </div>
    );
}
