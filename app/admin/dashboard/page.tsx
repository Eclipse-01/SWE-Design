import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Zap } from "lucide-react"

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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">超级管理员控制台</h1>
        <p className="text-sm sm:text-base text-muted-foreground">系统概览和管理</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">总组织数</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>系统中的组织总数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{organizationCount}</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>当前活跃用户数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{activeUserCount}</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Token 消耗</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>总 Token 使用量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalTokenUsage.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
