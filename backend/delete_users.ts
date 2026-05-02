import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Menghapus semua user beserta semua relasinya (cascade delete)
    await prisma.user.deleteMany();
    console.log('Semua user berhasil dihapus dari database.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
