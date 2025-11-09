import { db } from '@/lib/db'

export interface StudentCOAttainment {
  studentId: string
  coId: string
  attainmentPercentage: number
}

export interface CourseCOAttainment {
  coId: string
  attainmentLevel: number
  percentageMeetingTarget: number
  studentsMeetingTarget: number
  totalStudents: number
}

export interface POAttainment {
  poId: string
  directAttainment: number
  indirectAttainment: number
  overallAttainment: number
}

export class AttainmentCalculator {
  /**
   * Tier 1: Calculate Student-Level CO Attainment
   */
  static async calculateStudentCOAttainment(
    studentId: string,
    courseId: string,
    coId: string
  ): Promise<number> {
    try {
      // Get all assessment questions mapped to this CO for the course
      const assessmentQuestions = await db.assessmentQuestion.findMany({
        where: {
          assessment: {
            courseId
          },
          coMappings: {
            some: {
              coId
            }
          }
        },
        include: {
          coMappings: {
            select: {
              coId: true
            }
          }
        }
      })

      if (assessmentQuestions.length === 0) {
        return 0
      }

      const questionIds = assessmentQuestions.map(q => q.id)

      // Get student's marks for these questions
      const markScores = await db.markScore.findMany({
        where: {
          studentId,
          questionId: { in: questionIds }
        }
      })

      if (markScores.length === 0) {
        return 0
      }

      // Calculate total obtained and max marks
      const totalObtainedMarks = markScores.reduce((sum, mark) => sum + mark.marks, 0)
      const totalMaxMarks = assessmentQuestions.reduce((sum, question) => {
        const studentMark = markScores.find(mark => mark.questionId === question.id)
        return studentMark ? sum + question.maxMarks : sum
      }, 0)

      if (totalMaxMarks === 0) {
        return 0
      }

      return (totalObtainedMarks / totalMaxMarks) * 100
    } catch (error) {
      console.error('Error calculating student CO attainment:', error)
      return 0
    }
  }

  /**
   * Tier 2: Calculate Course-Level CO Attainment
   */
  static async calculateCourseCOAttainment(
    coId: string,
    courseId: string,
    sectionId?: string
  ): Promise<CourseCOAttainment> {
    try {
      // Get course details
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: {
          target: true,
          level1: true,
          level2: true,
          level3: true
        }
      })

      if (!course) {
        throw new Error('Course not found')
      }

      // Get students in scope
      let students
      if (sectionId) {
        students = await db.student.findMany({
          where: { sectionId }
        })
      } else {
        // Get all students in the course's batch
        const courseWithBatch = await db.course.findUnique({
          where: { id: courseId },
          select: { batchId: true }
        })
        
        if (courseWithBatch) {
          students = await db.student.findMany({
            where: { batchId: courseWithBatch.batchId }
          })
        }
      }

      if (students.length === 0) {
        return {
          coId,
          attainmentLevel: 0,
          percentageMeetingTarget: 0,
          studentsMeetingTarget: 0,
          totalStudents: 0
        }
      }

      // Calculate CO attainment for each student
      const studentAttainments: number[] = []
      for (const student of students) {
        const attainment = await this.calculateStudentCOAttainment(student.id, courseId, coId)
        studentAttainments.push(attainment)
      }

      // Count students meeting target
      const studentsMeetingTarget = studentAttainments.filter(
        attainment => attainment >= course.target
      ).length

      const percentageMeetingTarget = (studentsMeetingTarget / students.length) * 100

      // Determine attainment level
      let attainmentLevel = 0
      if (percentageMeetingTarget >= course.level3) {
        attainmentLevel = 3
      } else if (percentageMeetingTarget >= course.level2) {
        attainmentLevel = 2
      } else if (percentageMeetingTarget >= course.level1) {
        attainmentLevel = 1
      }

      return {
        coId,
        attainmentLevel,
        percentageMeetingTarget,
        studentsMeetingTarget,
        totalStudents: students.length
      }
    } catch (error) {
      console.error('Error calculating course CO attainment:', error)
      throw error
    }
  }

  /**
   * Tier 3: Calculate Program-Level PO Attainment
   */
  static async calculateDirectPOAttainment(
    poId: string,
    programId: string
  ): Promise<number> {
    try {
      // Get all CO-PO mappings for this PO
      const coPoMappings = await db.coPoMapping.findMany({
        where: { poId },
        include: {
          co: {
            include: {
              course: {
                select: {
                  id: true,
                  programId: true
                }
              }
            }
          }
        }
      })

      if (coPoMappings.length === 0) {
        return 0
      }

      // Filter mappings to only include courses from this program
      const programMappings = coPoMappings.filter(
        mapping => mapping.co.course.programId === programId
      )

      if (programMappings.length === 0) {
        return 0
      }

      let weightedSum = 0
      let totalWeight = 0

      // Calculate weighted sum using course-level CO attainments
      for (const mapping of programMappings) {
        const courseCOAttainment = await this.calculateCourseCOAttainment(
          mapping.coId,
          mapping.co.course.id
        )
        
        weightedSum += courseCOAttainment.attainmentLevel * mapping.level
        totalWeight += mapping.level
      }

      if (totalWeight === 0) {
        return 0
      }

      return weightedSum / totalWeight
    } catch (error) {
      console.error('Error calculating direct PO attainment:', error)
      return 0
    }
  }

  /**
   * Calculate Overall PO Attainment (Direct + Indirect)
   */
  static async calculateOverallPOAttainment(
    poId: string,
    programId: string,
    directWeight: number = 70,
    indirectWeight: number = 30
  ): Promise<POAttainment> {
    try {
      // Get PO details
      const po = await db.programOutcome.findUnique({
        where: { id: poId },
        select: { indirectAttainment: true }
      })

      if (!po) {
        throw new Error('PO not found')
      }

      // Calculate direct attainment
      const directAttainment = await this.calculateDirectPOAttainment(poId, programId)
      
      // Use indirect attainment from PO record (default to 3 if not set)
      const indirectAttainment = po.indirectAttainment || 3.0

      // Calculate overall attainment
      const overallAttainment = 
        (directAttainment * (directWeight / 100)) + 
        (indirectAttainment * (indirectWeight / 100))

      return {
        poId,
        directAttainment,
        indirectAttainment,
        overallAttainment
      }
    } catch (error) {
      console.error('Error calculating overall PO attainment:', error)
      throw error
    }
  }

  /**
   * Calculate all PO attainments for a program
   */
  static async calculateProgramPOAttainments(
    programId: string
  ): Promise<POAttainment[]> {
    try {
      // Get all POs for the program
      const pos = await db.programOutcome.findMany({
        where: { programId }
      })

      const poAttainments: POAttainment[] = []

      for (const po of pos) {
        const attainment = await this.calculateOverallPOAttainment(po.id, programId)
        poAttainments.push(attainment)
      }

      return poAttainments
    } catch (error) {
      console.error('Error calculating program PO attainments:', error)
      throw error
    }
  }

  /**
   * Calculate all CO attainments for a course
   */
  static async calculateCourseCOAttainments(
    courseId: string,
    sectionId?: string
  ): Promise<CourseCOAttainment[]> {
    try {
      // Get all COs for the course
      const cos = await db.courseOutcome.findMany({
        where: { courseId }
      })

      const coAttainments: CourseCOAttainment[] = []

      for (const co of cos) {
        const attainment = await this.calculateCourseCOAttainment(co.id, courseId, sectionId)
        coAttainments.push(attainment)
      }

      return coAttainments
    } catch (error) {
      console.error('Error calculating course CO attainments:', error)
      throw error
    }
  }
}