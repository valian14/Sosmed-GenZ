import Link from 'next/link';

export default function GameHubPage() {
    return (
        <div className="w-full min-h-screen border-x border-border p-6 font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-bold gradient-text">Arcade Center</h1>
                <p className="text-muted-foreground mt-2">Bored? Check out what we have built natively into the platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/game/offroad" className="group block relative rounded-2xl overflow-hidden glass p-4 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer">
                    <div className="h-40 w-full mb-4 bg-gradient-to-br from-cyan-900/50 to-purple-900/50 rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-5xl opacity-40 group-hover:scale-125 group-hover:opacity-60 transition-all">🚙</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">Offroad Game</h2>
                    <p className="text-sm text-gray-400">Play the latest Javascript-based driving simulation. Conquer the hills!</p>
                </Link>

                {/* More games placeholder */}
                <div className="group block relative rounded-2xl overflow-hidden glass p-4 border border-white/5 opacity-50 cursor-not-allowed">
                    <div className="h-40 w-full mb-4 bg-secondary/50 rounded-xl overflow-hidden relative flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">More Games Soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
