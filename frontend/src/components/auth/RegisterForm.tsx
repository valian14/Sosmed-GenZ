"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const registerSchema = z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
    confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/auth/register', data);
            setSuccess(response.data.message || 'Cek inbox emailmu!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 rounded-2xl glass"
        >
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
                <p className="text-gray-300 mt-2">Join GenZ Social today ✨</p>
            </div>

            {success ? (
                <div className="text-center space-y-4">
                    <div className="text-5xl">🎉</div>
                    <p className="text-green-400 font-medium text-lg">{success}</p>
                    <p className="text-muted-foreground text-sm">Please click the link in your email to verify your account.</p>
                    <Button asChild className="w-full mt-4 bg-secondary text-white hover:bg-secondary/80">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-black font-bold">Username</Label>
                        <Input
                            id="username"
                            placeholder="zuko_123"
                            {...register('username')}
                            className="bg-secondary/50 border-white/20 text-black placeholder:text-gray-500 focus:border-cyan-500"
                        />
                        {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-black font-bold">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            {...register('email')}
                            className="bg-secondary/50 border-white/20 text-black placeholder:text-gray-500 focus:border-cyan-500"
                        />
                        {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-black font-bold">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register('password')}
                                className="bg-secondary/50 border-white/20 text-black placeholder:text-gray-500 focus:border-cyan-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-black font-bold">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register('confirmPassword')}
                                className="bg-secondary/50 border-white/20 text-black placeholder:text-gray-500 focus:border-cyan-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-500"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/20"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                </form>
            )}

            {!success && (
                <div className="mt-6 text-center text-sm text-gray-300">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold">
                        Login
                    </Link>
                </div>
            )}
        </motion.div>
    );
}
