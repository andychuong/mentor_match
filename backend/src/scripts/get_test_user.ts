import { prisma } from '../config/database';

async function getTestUser() {
    const mentee = await prisma.user.findFirst({
        where: { role: 'mentee', email: { contains: 'mentee.seed' } },
    });
    if (mentee) {
        console.log(`TEST_USER_EMAIL=${mentee.email}`);
    } else {
        console.log('No seed mentee found');
    }
}

getTestUser()
    .finally(async () => {
        await prisma.$disconnect();
    });
