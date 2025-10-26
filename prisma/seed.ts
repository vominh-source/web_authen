// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

async function main() {
  const clients = [
    { name: 'service-a' },
    { name: 'service-b' },
    { name: 'service-c' },
  ];

  for (const c of clients) {
    // generate plaintext key to give to client
    const plain = randomBytes(24).toString('hex'); // you will output this
    const keyHash = hashKey(plain);

    // upsert so repeatable
    await prisma.client.upsert({
      where: { apiKeyHash: keyHash },
      update: {},
      create: {
        name: c.name,
        apiKeyHash: keyHash,
        isActive: true,
      },
    });

    console.log(`Client: ${c.name}, API_KEY (store this securely): ${plain}`);
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
