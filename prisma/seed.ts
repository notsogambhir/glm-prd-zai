import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create colleges
  const college1 = await db.college.upsert({
    where: { code: 'ENG' },
    update: {},
    create: {
      name: 'Engineering College',
      code: 'ENG',
      description: 'Main Engineering College'
    }
  })

  const college2 = await db.college.upsert({
    where: { code: 'SCI' },
    update: {},
    create: {
      name: 'Science College',
      code: 'SCI',
      description: 'Main Science College'
    }
  })

  console.log('Created colleges:', { college1, college2 })

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('password', 10)

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
  })

  const university = await db.user.upsert({
    where: { username: 'university' },
    update: {},
    create: {
      username: 'university',
      email: 'vc@obe.edu',
      name: 'Vice Chancellor',
      password: hashedPassword,
      role: 'UNIVERSITY'
    }
  })

  const deptHead = await db.user.upsert({
    where: { username: 'dept_head' },
    update: {},
    create: {
      username: 'dept_head',
      email: 'dean@obe.edu',
      name: 'Dean of Engineering',
      password: hashedPassword,
      role: 'DEPARTMENT',
      collegeId: college1.id
    }
  })

  const pc = await db.user.upsert({
    where: { username: 'pc_ece' },
    update: {},
    create: {
      username: 'pc_ece',
      email: 'pc.ece@obe.edu',
      name: 'ECE Program Coordinator',
      password: hashedPassword,
      role: 'PC',
      collegeId: college1.id
    }
  })

  const teacher = await db.user.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: {
      username: 'teacher1',
      email: 'teacher1@obe.edu',
      name: 'John Teacher',
      password: hashedPassword,
      role: 'TEACHER',
      collegeId: college1.id
    }
  })

  console.log('Created users:', { admin, university, deptHead, pc, teacher })

  // Create programs
  const programECE = await db.program.upsert({
    where: { code: 'BE_ECE' },
    update: {},
    create: {
      name: 'Bachelor of Engineering in Electronics and Communication',
      code: 'BE_ECE',
      collegeId: college1.id,
      duration: 4,
      target: 60.0,
      level1: 40.0,
      level2: 60.0,
      level3: 80.0
    }
  })

  const programCSE = await db.program.upsert({
    where: { code: 'BE_CSE' },
    update: {},
    create: {
      name: 'Bachelor of Engineering in Computer Science',
      code: 'BE_CSE',
      collegeId: college1.id,
      duration: 4,
      target: 60.0,
      level1: 40.0,
      level2: 60.0,
      level3: 80.0
    }
  })

  console.log('Created programs:', { programECE, programCSE })

  // Create batches
  const batch2025 = await db.batch.findFirst({
    where: {
      name: '2025-2029',
      programId: programECE.id
    }
  })

  const batch2025Data = batch2025 || await db.batch.create({
    data: {
      name: '2025-2029',
      startYear: 2025,
      programId: programECE.id
    }
  })

  const batch2024 = await db.batch.findFirst({
    where: {
      name: '2024-2028',
      programId: programECE.id
    }
  })

  const batch2024Data = batch2024 || await db.batch.create({
    data: {
      name: '2024-2028',
      startYear: 2024,
      programId: programECE.id
    }
  })

  console.log('Created batches:', { batch2025: batch2025Data, batch2024: batch2024Data })

  // Create sections
  const sectionA = await db.section.findFirst({
    where: {
      name: 'A',
      batchId: batch2025Data.id
    }
  })

  const sectionAData = sectionA || await db.section.create({
    data: {
      name: 'A',
      batchId: batch2025Data.id
    }
  })

  const sectionB = await db.section.findFirst({
    where: {
      name: 'B',
      batchId: batch2025Data.id
    }
  })

  const sectionBData = sectionB || await db.section.create({
    data: {
      name: 'B',
      batchId: batch2025Data.id
    }
  })

  console.log('Created sections:', { sectionA: sectionAData, sectionB: sectionBData })

  // Create some sample students
  const students: any[] = []
  for (let i = 1; i <= 20; i++) {
    const rollNo = `ECE25${i.toString().padStart(3, '0')}`
    const existingStudent = await db.student.findUnique({
      where: { rollNo }
    })
    
    const student = existingStudent || await db.student.create({
      data: {
        rollNo,
        name: `Student ${i}`,
        email: `student${i}@obe.edu`,
        batchId: batch2025Data.id,
        sectionId: i <= 10 ? sectionAData.id : sectionBData.id
      }
    })
    students.push(student)
  }

  console.log('Created students:', students.length, 'students')

  // Create program outcomes
  const pos: any[] = []
  for (let i = 1; i <= 12; i++) {
    const code = `PO${i}`
    const existingPO = await db.programOutcome.findFirst({
      where: {
        code,
        programId: programECE.id
      }
    })
    
    const po = existingPO || await db.programOutcome.create({
      data: {
        code,
        description: `Program Outcome ${i}: Engineering knowledge and problem solving`,
        programId: programECE.id
      }
    })
    pos.push(po)
  }

  console.log('Created program outcomes:', pos.length, 'POs')

  // Create teacher assignments
  await db.teacherAssignment.createMany({
    data: [
      {
        teacherId: teacher.id,
        pcId: pc.id
      }
    ]
  })

  console.log('Created teacher assignments')

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })