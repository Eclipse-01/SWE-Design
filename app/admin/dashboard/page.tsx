import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  // Fetch real data from database
  const organizationCount = await prisma.organization.count()
  const activeUserCount = await prisma.user.count({
    where: { status: 'ACTIVE' }
  })
  const organizations = await prisma.organization.findMany({
    select: { aiTokenUsage: true }
  })
  const totalTokenUsage = organizations.reduce((sum, org) => sum + org.aiTokenUsage, 0)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">超级管理员控制台</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="mica">
          <CardHeader>
            <CardTitle>总组织数</CardTitle>
            <CardDescription>系统中的组织总数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organizationCount}</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader>
            <CardTitle>活跃用户</CardTitle>
            <CardDescription>当前活跃用户数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUserCount}</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader>
            <CardTitle>AI Token 消耗</CardTitle>
            <CardDescription>总 Token 使用量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTokenUsage.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
