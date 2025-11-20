"use server"

import { prisma } from "@/lib/db"
import { CreateUserSchema } from "@/lib/validations"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createUser(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    organizationId: formData.get("organizationId") || undefined,
  }

  const validated = CreateUserSchema.parse(data)

  // Validate organization exists if organizationId is provided
  if (validated.organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { idString: validated.organizationId }
    })

    if (!organization) {
      throw new Error("组织不存在")
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validated.password, 10)

  await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      passwordHash,
      role: validated.role,
      organizationId: validated.organizationId,
      status: 'ACTIVE'
    }
  })

  revalidatePath("/admin/users")
  redirect("/admin/users")
}

export async function getUsers(page: number = 1, perPage: number = 20) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const skip = (page - 1) * perPage

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      include: {
        organization: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            coursesOwned: true,
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage
    }),
    prisma.user.count()
  ])

  return {
    users,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage)
    }
  }
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'PENDING') {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status }
  })

  revalidatePath("/admin/users")
  return { success: true }
}
