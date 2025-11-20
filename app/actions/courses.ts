"use server"

import { prisma } from "@/lib/db"
import { CreateCourseSchema } from "@/lib/validations"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Generate a random 8-character course code with uppercase letters and numbers
function generateCourseCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createCourse(formData: FormData) {
  const session = await auth()
  
  // Only teachers and super admins can create courses
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error("未授权：仅教师可以创建课程")
  }

  // Teachers must have an organization
  if (session.user.role === 'TEACHER' && !session.user.organizationId) {
    throw new Error("您未分配组织，无法创建课程")
  }

  const data = {
    name: formData.get("name") as string,
    description: formData.get("description") as string || undefined,
  }

  const validated = CreateCourseSchema.parse(data)

  // Generate a unique course code
  let courseCode = generateCourseCode()
  let attempts = 0
  const maxAttempts = 10
  
  // Ensure the code is unique
  while (attempts < maxAttempts) {
    const existing = await prisma.course.findUnique({
      where: { code: courseCode }
    })
    
    if (!existing) {
      break
    }
    
    courseCode = generateCourseCode()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error("无法生成唯一的课程代码，请重试")
  }

  // Create the course
  await prisma.course.create({
    data: {
      name: validated.name,
      code: courseCode,
      description: validated.description,
      teacherId: session.user.id,
      organizationId: session.user.organizationId!,
    }
  })

  revalidatePath("/teacher/courses")
  redirect("/teacher/courses")
}

export async function archiveCourse(courseId: string) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权" }
  }

  try {
    // Verify the course belongs to the teacher (unless super admin)
    if (session.user.role === 'TEACHER') {
      const course = await prisma.course.findFirst({
        where: {
          idString: courseId,
          teacherId: session.user.id
        }
      })

      if (!course) {
        return { success: false, error: "课程不存在或您无权操作" }
      }
    }

    await prisma.course.update({
      where: { idString: courseId },
      data: { archived: true }
    })

    revalidatePath("/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Archive course error:", error)
    return { success: false, error: "归档课程失败" }
  }
}

export async function deleteCourse(courseId: string) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, error: "未授权" }
  }

  try {
    // Verify the course belongs to the teacher (unless super admin)
    if (session.user.role === 'TEACHER') {
      const course = await prisma.course.findFirst({
        where: {
          idString: courseId,
          teacherId: session.user.id
        }
      })

      if (!course) {
        return { success: false, error: "课程不存在或您无权操作" }
      }
    }

    // Delete the course (cascade delete will handle related records)
    await prisma.course.delete({
      where: { idString: courseId }
    })

    revalidatePath("/teacher/courses")
    return { success: true }
  } catch (error) {
    console.error("Delete course error:", error)
    return { success: false, error: "删除课程失败" }
  }
}
