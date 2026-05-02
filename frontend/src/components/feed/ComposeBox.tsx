"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useAuthStore from '@/store/useAuthStore';
import { ImageIcon, SendHorizontal, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const postSchema = z.object({
    content: z.string().min(1, 'Post cannot be empty').max(280, 'Max 280 characters'),
});

type PostFormData = z.infer<typeof postSchema>;

export default function ComposeBox({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        mode: 'onChange'
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
                    const maxDim = 800; // max width/height

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
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const optimizedBase64 = await optimizeImage(file);
            setPreviewUrl(optimizedBase64);
        }
    };

    const onSubmit = async (data: PostFormData) => {
        setLoading(true);
        try {
            const payload = {
                content: data.content,
                media_url: previewUrl
            };
            await api.post('/posts', payload);
            reset();
            setPreviewUrl(null);
            if (onSuccess) onSuccess();
            // Socket will broadcast it
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-cyan-500/20">
                <AvatarImage src={user?.avatar || '/default-avatar.png'} />
                <AvatarFallback className="bg-cyan-900 text-cyan-400">
                    {user?.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-3">
                <div>
                    <Textarea
                        placeholder="What's your vibe right now?"
                        {...register('content')}
                        className="w-full resize-none bg-transparent border-none text-lg p-0 focus-visible:ring-0 text-white placeholder:text-muted-foreground/60 min-h-[60px]"
                    />
                    {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>}
                </div>

                {previewUrl && (
                    <div className="relative inline-block mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Preview" className="max-h-[300px] rounded-xl border border-white/10" />
                        <button
                            type="button"
                            onClick={() => setPreviewUrl(null)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        hidden
                        accept="image/*"
                    />
                    <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="icon"
                        className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 rounded-full"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </Button>

                    <Button
                        type="submit"
                        disabled={loading || !isValid}
                        className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white px-6 font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Posting...' : 'Post'}
                        <SendHorizontal className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
