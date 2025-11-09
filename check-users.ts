import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({ 
    select: { username: true, role: true, name: true } 
  });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  await db.$disconnect();
}

main().catch(console.error);