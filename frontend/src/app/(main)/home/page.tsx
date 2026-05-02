import Feed from '@/components/feed/Feed';
import StoriesFeed from '@/components/stories/StoriesFeed';

export default function HomePage() {
    return (
        <div className="w-full flex flex-col pt-4 md:pt-6 border-x border-border min-h-screen">
            <div className="px-4 pb-0 z-20 bg-background/80 backdrop-blur-md">
                <h1 className="text-xl font-bold gradient-text mb-4 hidden md:block">Home</h1>
                <StoriesFeed />
            </div>
            <Feed />
        </div>
    );
}
