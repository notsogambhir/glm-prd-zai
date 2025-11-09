import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Adding users to existing database...');
  
  try {
    // Get existing college
    const college = await db.college.findFirst();
    if (!college) {
      console.error('No college found. Please run full seed first.');
      return;
    }

    console.log('Using college:', college.name);

    // Create users
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const admin = await db.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@obe.edu',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    const pc = await db.user.upsert({
      where: { username: 'pc_ece' },
      update: {},
      create: {
        username: 'pc_ece',
        email: 'pc.ece@obe.edu',
        name: 'ECE Program Coordinator',
        password: hashedPassword,
        role: 'PC',
        collegeId: college.id
      }
    });

    const teacher = await db.user.upsert({
      where: { username: 'teacher1' },
      update: {},
      create: {
        username: 'teacher1',
        email: 'teacher1@obe.edu',
        name: 'John Teacher',
        password: hashedPassword,
        role: 'TEACHER',
        collegeId: college.id
      }
    });

    console.log('Created users:', { admin: admin.username, pc: pc.username, teacher: teacher.username });
    console.log('Users added successfully!');
  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    await db.$disconnect();
  }
}

main();