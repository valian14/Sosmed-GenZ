import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'jiejia983@gmail.com' } });
    if (!user) return console.log("User not found");

    // Simulate what generateTokens does
    const payloadAccess = { userId: user.id };
    const payloadRefresh = { userId: user.id };

    console.log("Signing token...", process.env.JWT_ACCESS_SECRET || 'secret');
    const accessToken = jwt.sign(payloadAccess, process.env.JWT_ACCESS_SECRET || 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign(payloadRefresh, process.env.JWT_REFRESH_SECRET || 'secret', { expiresIn: '7d' });

    console.log("Tokens generated!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
