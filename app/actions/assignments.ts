"use server"

import { prisma } from "@/lib/db"
import { CreateAssignmentSchema, UpdateAssignmentSchema, CreateSubmissionSchema, GradeSubmissionSchema } from "@/lib/validations"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { gradeSubmissionWithAI, checkSubscriptionAndDeduct } from "@/lib/gemini"

export async function createAssignment(formData: FormData) {
  const session = await auth()
  
  // Only teachers and super admins can create assignments
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权：仅教师可以创建作业" }
  }

  try {
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      deadline: new Date(formData.get("deadline") as string),
      maxScore: formData.get("maxScore") as string,
      courseId: formData.get("courseId") as string,
    }

    const validated = CreateAssignmentSchema.parse(data)

    // Verify the course exists and belongs to the teacher (unless super admin)
    const course = await prisma.course.findUnique({
      where: { idString: validated.courseId }
    })

    if (!course) {
      return { success: false, error: "课程不存在" }
    }

    if (session.user.role === 'TEACHER' && course.teacherId !== session.user.id) {
      return { success: false, error: "您无权在此课程中创建作业" }
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title: validated.title,
        description: validated.description,
        deadline: validated.deadline,
        maxScore: validated.maxScore,
        courseId: validated.courseId,
        status: 'PUBLISHED', // Default to published
      }
    })

    revalidatePath(`/teacher/courses/${validated.courseId}`)
    return { success: true, assignmentId: assignment.id }
  } catch (error) {
    console.error("Create assignment error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "创建作业失败" }
  }
}

export async function updateAssignment(assignmentId: string, formData: FormData) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权" }
  }

  try {
    // Get the assignment to verify ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    })

    if (!assignment) {
      return { success: false, error: "作业不存在" }
    }

    // Verify ownership (unless super admin)
    if (session.user.role === 'TEACHER' && assignment.course.teacherId !== session.user.id) {
      return { success: false, error: "您无权修改此作业" }
    }

    const data: any = {}
    
    if (formData.get("title")) {
      data.title = formData.get("title") as string
    }
    if (formData.get("description")) {
      data.description = formData.get("description") as string
    }
    if (formData.get("deadline")) {
      data.deadline = new Date(formData.get("deadline") as string)
    }
    if (formData.get("maxScore")) {
      data.maxScore = Number(formData.get("maxScore"))
    }
    if (formData.get("status")) {
      data.status = formData.get("status") as string
    }

    const validated = UpdateAssignmentSchema.parse(data)

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: validated
    })

    revalidatePath(`/teacher/courses/${assignment.courseId}`)
    return { success: true }
  } catch (error) {
    console.error("Update assignment error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "更新作业失败" }
  }
}

export async function deleteAssignment(assignmentId: string) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权" }
  }

  try {
    // Get the assignment to verify ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    })

    if (!assignment) {
      return { success: false, error: "作业不存在" }
    }

    // Verify ownership (unless super admin)
    if (session.user.role === 'TEACHER' && assignment.course.teacherId !== session.user.id) {
      return { success: false, error: "您无权删除此作业" }
    }

    // Delete the assignment
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    revalidatePath(`/teacher/courses/${assignment.courseId}`)
    return { success: true }
  } catch (error) {
    console.error("Delete assignment error:", error)
    return { success: false, error: "删除作业失败" }
  }
}

export async function submitAssignment(formData: FormData) {
  const session = await auth()
  
  if (!session || session.user.role !== 'STUDENT') {
    return { success: false, error: "未授权：仅学生可以提交作业" }
  }

  try {
    const data = {
      content: formData.get("content") as string,
      assignmentId: formData.get("assignmentId") as string,
    }

    const validated = CreateSubmissionSchema.parse(data)

    // Verify assignment exists and is active
    const assignment = await prisma.assignment.findUnique({
      where: { id: validated.assignmentId },
      include: { course: true }
    })

    if (!assignment) {
      return { success: false, error: "作业不存在" }
    }

    if (assignment.status !== 'PUBLISHED') {
      return { success: false, error: "作业未发布" }
    }

    if (new Date() > assignment.deadline) {
      return { success: false, error: "作业已截止" }
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: assignment.courseId
        }
      }
    })

    if (!enrollment) {
      return { success: false, error: "您未选修此课程" }
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        studentId: session.user.id,
        assignmentId: validated.assignmentId
      }
    })

    if (existingSubmission) {
      // Update existing submission
      await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content: validated.content,
          submittedAt: new Date(),
          status: 'SUBMITTED'
        }
      })
    } else {
      // Create new submission
      await prisma.submission.create({
        data: {
          content: validated.content,
          studentId: session.user.id,
          assignmentId: validated.assignmentId,
          status: 'SUBMITTED'
        }
      })
    }

    revalidatePath(`/student/courses/${assignment.courseId}/assignments/${validated.assignmentId}`)
    return { success: true }
  } catch (error) {
    console.error("Submit assignment error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "提交作业失败" }
  }
}

export async function gradeSubmission(formData: FormData) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权：仅教师可以批改作业" }
  }

  try {
    const data = {
      submissionId: formData.get("submissionId") as string,
      score: formData.get("score") as string,
      teacherFeedback: formData.get("teacherFeedback") as string || undefined,
    }

    const validated = GradeSubmissionSchema.parse(data)

    // Get submission with assignment and course info
    const submission = await prisma.submission.findUnique({
      where: { id: validated.submissionId },
      include: {
        assignment: {
          include: {
            course: true
          }
        }
      }
    })

    if (!submission) {
      return { success: false, error: "提交不存在" }
    }

    // Verify ownership (unless super admin)
    if (session.user.role === 'TEACHER' && submission.assignment.course.teacherId !== session.user.id) {
      return { success: false, error: "您无权批改此作业" }
    }

    // Update submission with grade
    await prisma.submission.update({
      where: { id: validated.submissionId },
      data: {
        score: validated.score,
        teacherFeedback: validated.teacherFeedback,
        status: 'GRADED'
      }
    })

    revalidatePath(`/teacher/courses/${submission.assignment.courseId}`)
    return { success: true }
  } catch (error) {
    console.error("Grade submission error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "批改作业失败" }
  }
}

export async function gradeSubmissionWithAIAction(submissionId: string) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权：仅教师可以使用AI批改" }
  }

  try {
    // Get submission with assignment and course info
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return { success: false, error: "提交不存在" }
    }

    // Verify ownership (unless super admin)
    if (session.user.role === 'TEACHER' && submission.assignment.course.teacherId !== session.user.id) {
      return { success: false, error: "您无权批改此作业" }
    }

    // Check subscription and deduct tokens
    const estimatedTokens = 1000 // Estimate tokens for grading
    const canUseAI = await checkSubscriptionAndDeduct(
      submission.assignment.course.organizationId,
      estimatedTokens
    )

    if (!canUseAI) {
      return { success: false, error: "AI 服务额度已耗尽或订阅过期，请联系管理员" }
    }

    // Call AI grading
    const aiResult = await gradeSubmissionWithAI(
      submission.assignment.description,
      submission.content,
      submission.assignment.maxScore
    )

    // Update submission with AI results
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: aiResult.score,
        teacherFeedback: aiResult.feedback,
        aiAnalysis: aiResult as any,
        status: 'GRADED'
      }
    })

    revalidatePath(`/teacher/courses/${submission.assignment.courseId}`)
    return { success: true, result: aiResult }
  } catch (error) {
    console.error("AI grade submission error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "AI批改失败" }
  }
}
