import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (existingSuperAdmin) {
    console.log('Super admin already exists, skipping seed.')
    return
  }

  // Create a default super admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@intelliteach.com',
      name: 'Super Admin',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      // organizationId is optional for SUPER_ADMIN
    }
  })

  console.log('Created super admin:', superAdmin.email)
  console.log('Default password: admin123')
  console.log('Please change this password after first login!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
