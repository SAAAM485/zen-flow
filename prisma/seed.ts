import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding with simplified script...');

  await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
    },
  });

  console.log('Created test user.');

  const userCount = await prisma.user.count();
  console.log(`Total users in database: ${userCount}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });