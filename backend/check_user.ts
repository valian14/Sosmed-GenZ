import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'jiejia983@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }
    console.log(`User found: ${user.username}, email: ${user.email}, is_verified: ${user.is_verified}, hash_length: ${user.password_hash?.length}`);

    // reset password just in case?
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
