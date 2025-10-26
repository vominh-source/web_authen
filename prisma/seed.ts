// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = [
    { name: 'service-a', key: 'service-a-key-123' },
    { name: 'service-b', key: 'service-b-key-456' },
    { name: 'service-c', key: 'service-c-key-789' },
  ];

  for (const c of clients) {
    // Store raw key directly (no hashing for easy testing)
    await prisma.client.upsert({
      where: { apiKey: c.key }, // using apiKey field now
      update: {},
      create: {
        name: c.name,
        apiKey: c.key, // raw key stored here
        isActive: true,
      },
    });

    console.log(`Client: ${c.name}, API_KEY: ${c.key}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
