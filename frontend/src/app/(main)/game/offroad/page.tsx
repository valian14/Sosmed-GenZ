"use client";

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OffroadGamePage() {
    return (
        <div className="w-full h-screen flex flex-col bg-black">
            <div className="p-4 flex items-center gap-4 bg-card/50 backdrop-blur-md border-b border-white/10 shrink-0">
                <Link href="/game" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Arcade</span>
                </Link>
                <h1 className="text-xl font-bold text-white">Drive Mad 🚙</h1>
            </div>

            <div className="flex-1 w-full relative">
                <iframe
                    src="/games/offroad/index.html"
                    className="absolute inset-0 w-full h-full border-none"
                    title="Offroad Game"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}
