"use client";
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import useUiStore from '@/store/useUiStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const storySchema = z.object({
    content: z.string().max(280).optional(),
});
type StoryForm = z.infer<typeof storySchema>;

export default function ComposeStoryModal() {
    const { closeComposeStory } = useUiStore();
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset } = useForm<StoryForm>({
        resolver: zodResolver(storySchema)
    });

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

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const optimized = await optimizeImage(file);
        setPreviewUrl(optimized);
    };

    const onSubmit = async (data: StoryForm) => {
        if (!data.content && !previewUrl) return; // Must have one
        setLoading(true);
        try {
            await api.post('/stories', { content: data.content, media_url: previewUrl });
            reset();
            setPreviewUrl(null);
            closeComposeStory();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-3xl w-full max-w-sm p-0 shadow-2xl relative overflow-hidden flex flex-col aspect-[9/16]"
            >
                <button onClick={closeComposeStory} className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full z-20 transition-colors bg-black/40 backdrop-blur-md"><X className="w-5 h-5" /></button>

                <div className="flex-1 relative bg-neutral-900 group flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                        <img src={previewUrl} className="w-full h-full object-cover" alt="story match" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-muted-foreground cursor-pointer hover:text-white transition-colors" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="w-12 h-12 opacity-50 drop-shadow-md" />
                            <span className="text-sm font-medium tracking-wide">Tap to Select Photo</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-black/60 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-3 rounded-b-3xl border-t border-white/10">
                    <Textarea
                        placeholder="Add a text caption..."
                        {...register('content')}
                        className="bg-transparent border-none text-white focus-visible:ring-0 resize-none min-h-[40px] text-sm p-0 placeholder:text-white/50 drop-shadow-md"
                    />
                    <div className="flex justify-between items-center mt-2">
                        <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={handleFile} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-white bg-white/10 hover:bg-white/20 rounded-full h-9 w-9"><ImageIcon className="w-4 h-4" /></Button>

                        <Button type="submit" disabled={loading || (!previewUrl && !register('content'))} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-full h-9 px-6 font-bold text-xs tracking-wide shadow-cyan-500/20 shadow-lg">
                            {loading ? 'Posting...' : 'Share Story'}
                        </Button>
                    </div>
                </form>

            </motion.div>
        </div>
    )
}
