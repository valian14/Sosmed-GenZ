import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users found");
        return;
    }

    console.log("Found user:", user.username);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
        console.log("Attempting to create story...");
        const story = await prisma.story.create({
            data: {
                user_id: user.id,
                content: "Test story",
                expires_at: expiresAt
            }
        });
        console.log("Story created successfully:", story.id);
    } catch (e) {
        console.error("Prisma error:", e);
    }
}

test()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
