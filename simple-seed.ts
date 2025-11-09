import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  try {
    // Clean existing data
    await db.teacherAssignment.deleteMany();
    await db.programOutcome.deleteMany();
    await db.student.deleteMany();
    await db.section.deleteMany();
    await db.batch.deleteMany();
    await db.course.deleteMany();
    await db.program.deleteMany();
    await db.user.deleteMany();
    await db.college.deleteMany();
    
    console.log('Cleared existing data');

    // Create colleges
    const college1 = await db.college.create({
      data: {
        name: 'Engineering College',
        code: 'ENG',
        description: 'Main Engineering College'
      }
    });

    console.log('Created college:', college1.name);

    // Create users
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const admin = await db.user.create({
      data: {
        username: 'admin',
        email: 'admin@obe.edu',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    const pc = await db.user.create({
      data: {
        username: 'pc_ece',
        email: 'pc.ece@obe.edu',
        name: 'ECE Program Coordinator',
        password: hashedPassword,
        role: 'PC',
        collegeId: college1.id
      }
    });

    const teacher = await db.user.create({
      data: {
        username: 'teacher1',
        email: 'teacher1@obe.edu',
        name: 'John Teacher',
        password: hashedPassword,
        role: 'TEACHER',
        collegeId: college1.id
      }
    });

    console.log('Created users:', { admin: admin.username, pc: pc.username, teacher: teacher.username });

    // Create program
    const programECE = await db.program.create({
      data: {
        name: 'Bachelor of Engineering in Electronics and Communication',
        code: 'BE_ECE',
        collegeId: college1.id,
        duration: 4,
        target: 60.0,
        level1: 40.0,
        level2: 60.0,
        level3: 80.0
      }
    });

    console.log('Created program:', programECE.name);

    // Create batch
    const batch2025 = await db.batch.create({
      data: {
        name: '2025-2029',
        startYear: 2025,
        programId: programECE.id
      }
    });

    console.log('Created batch:', batch2025.name);

    // Create sections
    const sectionA = await db.section.create({
      data: {
        name: 'A',
        batchId: batch2025.id
      }
    });

    const sectionB = await db.section.create({
      data: {
        name: 'B',
        batchId: batch2025.id
      }
    });

    console.log('Created sections: A, B');

    // Create some sample students
    for (let i = 1; i <= 20; i++) {
      await db.student.create({
        data: {
          rollNo: `ECE25${i.toString().padStart(3, '0')}`,
          name: `Student ${i}`,
          email: `student${i}@obe.edu`,
          batchId: batch2025.id,
          sectionId: i <= 10 ? sectionA.id : sectionB.id
        }
      });
    }

    console.log('Created 20 students');

    // Create program outcomes
    for (let i = 1; i <= 12; i++) {
      await db.programOutcome.create({
        data: {
          code: `PO${i}`,
          description: `Program Outcome ${i}: Engineering knowledge and problem solving`,
          programId: programECE.id
        }
      });
    }

    console.log('Created 12 program outcomes');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();