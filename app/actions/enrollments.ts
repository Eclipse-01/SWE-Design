"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function joinCourse(courseCode: string) {
  const session = await auth()
  
  if (!session || session.user.role !== 'STUDENT') {
    return { success: false, error: "未授权：仅学生可以加入课程" }
  }

  // Validate student has an organization
  if (!session.user.organizationId) {
    return { success: false, error: "您未分配组织，无法加入课程" }
  }

  try {
    // Find course by code
    const course = await prisma.course.findUnique({
      where: { 
        code: courseCode.trim().toUpperCase()
      }
    })

    if (!course) {
      return { success: false, error: "课程代码不存在" }
    }

    // Check if course is archived
    if (course.archived) {
      return { success: false, error: "该课程已归档" }
    }

    // Check if course belongs to student's organization
    if (course.organizationId !== session.user.organizationId) {
      return { success: false, error: "该课程不属于您的组织" }
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.idString
        }
      }
    })

    if (existingEnrollment) {
      return { success: false, error: "您已加入此课程" }
    }

    // Create enrollment
    await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.idString
      }
    })

    revalidatePath("/student/courses")
    return { success: true }
  } catch (error) {
    console.error("Join course error:", error)
    return { success: false, error: "加入课程失败，请稍后重试" }
  }
}

export async function leaveCourse(courseId: string) {
  const session = await auth()
  
  if (!session || session.user.role !== 'STUDENT') {
    return { success: false, error: "未授权" }
  }

  try {
    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    })

    revalidatePath("/student/courses")
    return { success: true }
  } catch (error) {
    console.error("Leave course error:", error)
    return { success: false, error: "退出课程失败" }
  }
}
