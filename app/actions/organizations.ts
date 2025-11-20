"use server"

import { prisma } from "@/lib/db"
import { CreateOrganizationSchema, UpdateSubscriptionSchema } from "@/lib/validations"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createOrganization(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const data = {
    name: formData.get("name"),
    aiTokenLimit: formData.get("aiTokenLimit") || "100000",
  }

  const validated = CreateOrganizationSchema.parse(data)

  await prisma.organization.create({
    data: {
      name: validated.name,
      aiTokenLimit: validated.aiTokenLimit,
    }
  })

  revalidatePath("/admin/organizations")
  redirect("/admin/organizations")
}

export async function getOrganizations() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  return await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, courses: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateOrganizationSubscription(
  organizationId: string,
  aiSubStatus: 'ACTIVE' | 'EXPIRED' | 'INACTIVE',
  aiSubEndDate: Date | null,
  aiTokenLimit: number
) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  await prisma.organization.update({
    where: { idString: organizationId },
    data: {
      aiSubStatus,
      aiSubEndDate,
      aiTokenLimit,
    }
  })

  revalidatePath("/admin/organizations")
  return { success: true }
}
