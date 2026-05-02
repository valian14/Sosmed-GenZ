"use client";
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import ComposeBox from './ComposeBox';
import useUiStore from '@/store/useUiStore';

export default function ComposeBoxModal() {
    const { closeComposePost } = useUiStore();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative"
            >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white tracking-tight">Create a Post</h2>
                    <button onClick={closeComposePost} className="text-muted-foreground hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <ComposeBox onSuccess={closeComposePost} />
            </motion.div>
        </div>
    )
}
