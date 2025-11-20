"use server"

import { prisma } from "@/lib/db"
import { CreateAssignmentSchema, UpdateAssignmentSchema } from "@/lib/validations"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

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
