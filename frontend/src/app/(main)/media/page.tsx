"use client";

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

const INDONESIAN_VIDEOS = [
    "aKtb7Y3qOck", // Wonderland Indonesia
    "hA5llB21t5Q", // Wonderful Indonesia
    "XGzMe6nCPEw", // Bali Cinematic
    "F-B7ZIfT-70", // Jakarta Cinematic
    "9A2l_9s6j2k", // Raja Ampat
    "HGBxP4k7dBM"  // Komodo Island
];

export default function MediaFeed() {
    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] overflow-y-scroll snap-y snap-mandatory bg-black rounded-none md:rounded-2xl border-0 md:border border-white/10 md:mt-4 mx-0 md:mx-4 relative thin-scrollbar">
            {INDONESIAN_VIDEOS.map((vid, i) => (
                <div key={i} className="h-full w-full snap-start relative flex justify-center bg-black overflow-hidden group">
                    {/* The Iframe itself capturing the main block */}
                    <iframe
                        src={`https://www.youtube.com/embed/${vid}?autoplay=0&loop=1&playlist=${vid}&controls=0&modestbranding=1&rel=0`}
                        className="w-full max-w-md h-[110%] -mt-[5%] object-cover shadow-2xl pointer-events-auto"
                        title="GenZ Media"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />

                    {/* Gradient Overlays for aesthetics */}
                    <div className="absolute inset-0 max-w-md mx-auto pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0" />

                    {/* Floating Side Actions to mimic TikTok/Reels */}
                    <div className="absolute right-4 md:right-[calc(50%-13rem)] bottom-24 md:bottom-20 flex flex-col items-center gap-6 z-10 drop-shadow-2xl">
                        <ActionIcon icon={Heart} label={Math.floor(Math.random() * 90 + 10) + "K"} />
                        <ActionIcon icon={MessageCircle} label={Math.floor(Math.random() * 900 + 100).toString()} />
                        <ActionIcon icon={Share2} label="Share" />
                        <ActionIcon icon={MoreHorizontal} label="" />
                    </div>

                    {/* Fake Creator Info */}
                    <div className="absolute left-4 md:left-[calc(50%-13rem)] bottom-24 md:bottom-20 z-10 flex flex-col gap-2 max-w-[200px]">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 p-0.5 flex shrink-0 shadow-lg">
                                <img src="/default-avatar.png" className="w-full h-full rounded-full object-cover" alt="creator" />
                            </div>
                            <span className="text-white font-bold text-sm tracking-wide drop-shadow-md">@indo_{i}</span>
                            <button className="px-2 py-0.5 bg-transparent border border-white/40 rounded-full text-white text-[10px] uppercase font-bold hover:bg-white/20 transition-colors backdrop-blur-sm">Follow</button>
                        </div>
                        <p className="text-white/90 text-xs font-medium drop-shadow-md line-clamp-2">Exploring the majestic beauties of Indonesia! GenZ vibes through the cinematic lens 🎥✨</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ActionIcon({ icon: Icon, label }: { icon: any, label: string }) {
    const [active, setActive] = useState(false);
    return (
        <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => setActive(!active)}>
            <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-xl ${active ? 'bg-pink-500/20 text-pink-500' : 'bg-black/40 text-white group-hover:bg-white/20'}`}>
                <Icon className={`w-7 h-7 ${active ? 'fill-current scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'group-hover:scale-110 transition-transform'}`} />
            </div>
            {label && <span className="text-white text-xs font-extrabold drop-shadow-md">{label}</span>}
        </div>
    );
}
