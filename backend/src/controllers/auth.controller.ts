import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service';
import prisma from '../utils/prisma';

const generateTokens = (userId: string) => {
    const payloadAccess = { userId };
    const payloadRefresh = { userId };

    const accessToken = jwt.sign(payloadAccess, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign(payloadRefresh, process.env.JWT_REFRESH_SECRET || 'secret', { expiresIn: '7d' });

    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password_hash,
            }
        });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.emailToken.create({
            data: {
                user_id: user.id,
                token: verificationToken,
                type: 'email_verify',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
        });

        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: 'User created. Please check your email to verify.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const ip_address = req.ip || req.socket.remoteAddress || 'unknown';

        const loginAttempt = await prisma.loginAttempt.findUnique({
            where: { ip_address_email: { ip_address, email } }
        });

        if (loginAttempt && loginAttempt.locked_until && loginAttempt.locked_until > new Date()) {
            return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            await prisma.loginAttempt.upsert({
                where: { ip_address_email: { ip_address, email } },
                update: {
                    attempts: { increment: 1 },
                    locked_until: loginAttempt && loginAttempt.attempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null
                },
                create: { ip_address, email, attempts: 1 }
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email first' });
        }

        // Reset attempts on success
        await prisma.loginAttempt.deleteMany({
            where: { ip_address, email }
        });

        const { accessToken, refreshToken } = generateTokens(user.id);

        await prisma.refreshToken.create({
            data: {
                user_id: user.id,
                token: refreshToken,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            accessToken,
            user: { id: user.id, username: user.username, avatar: user.avatar, bio: user.bio }
        });
    } catch (error: any) {
        console.error("Login Error details:", error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const emailToken = await prisma.emailToken.findUnique({ where: { token } });
        if (!emailToken || emailToken.expires_at < new Date()) {
            return res.status(400).json({ error: 'Token is invalid or expired' });
        }

        if (emailToken.used) {
            const user = await prisma.user.findUnique({ where: { id: emailToken.user_id } });
            if (user?.is_verified) {
                return res.json({ message: 'Email already verified' });
            }
            return res.status(400).json({ error: 'Token has already been used' });
        }

        await prisma.user.update({
            where: { id: emailToken.user_id },
            data: { is_verified: true }
        });

        await prisma.emailToken.update({
            where: { id: emailToken.id },
            data: { used: true }
        });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revoked: true }
            });
        }
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getRefreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

        const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!storedToken || storedToken.revoked || storedToken.expires_at < new Date()) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'secret');

        // Refresh token rotation
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true }
        });

        const tokens = generateTokens(decoded.userId);

        await prisma.refreshToken.create({
            data: {
                user_id: decoded.userId,
                token: tokens.refreshToken,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken: tokens.accessToken });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
