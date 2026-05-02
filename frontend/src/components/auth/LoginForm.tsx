"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAccessToken);
    const setUser = useAuthStore((state) => state.setUser);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', data);
            setAuth(response.data.accessToken);
            setUser(response.data.user);
            router.push('/home');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md p-8 rounded-2xl glass"
        >
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text">GenZ Social</h1>
                <p className="text-gray-300 mt-2">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-black font-bold">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...register('email')}
                        className="bg-secondary/50 border-white/20 text-black placeholder:text-gray-500 focus:border-cyan-500"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="password" className="text-black font-bold">Password</Label>
                        <Link href="#" className="text-sm text-cyan-500 hover:text-cyan-600 font-medium">Forgot password?</Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        className="bg-secondary/50 border-white/20 text-black placeholder:text-gray-500 focus:border-cyan-500"
                    />
                    {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/20"
                >
                    {loading ? 'Signing in...' : 'Login'}
                </Button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-300">
                Don't have an account?{' '}
                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-bold">
                    Sign up
                </Link>
            </div>
        </motion.div>
    );
}
