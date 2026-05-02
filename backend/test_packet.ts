import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const result = await prisma.$queryRaw`SHOW VARIABLES LIKE 'max_allowed_packet'`;
        console.log(result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
