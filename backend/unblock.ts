import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Clear lockouts
    await prisma.loginAttempt.deleteMany();
    // Verify all existing users
    await prisma.user.updateMany({
        data: { is_verified: true }
    });
    console.log('Login attempts cleared and all users verified.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
