"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function VerifyContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const hasFetched = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
            return;
        }

        if (hasFetched.current) return;
        hasFetched.current = true;

        api.get(`/auth/verify?token=${token}`)
            .then(() => {
                setStatus('success');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. Token might be expired.');
            });
    }, [token]);

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-background to-background"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 rounded-2xl glass text-center"
            >
                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h2 className="text-xl font-semibold">Verifying your account...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="text-6xl">✨</div>
                        <h2 className="text-2xl font-bold gradient-text">Account Verified!</h2>
                        <p className="text-muted-foreground">Your email has been successfully verified. Welcome to GenZ Social!</p>
                        <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20">
                            <Link href="/login">Continue to Login</Link>
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="text-6xl">💔</div>
                        <h2 className="text-2xl font-bold text-red-500">Verification Failed</h2>
                        <p className="text-muted-foreground">{message}</p>
                        <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </div>
                )}
            </motion.div>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-white flex justify-center items-center">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
