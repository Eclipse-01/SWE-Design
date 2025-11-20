import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function UsersPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  const users = await prisma.user.findMany({
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
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">用户管理</h1>
        <Link href="/admin/users/create">
          <Button>创建用户</Button>
        </Link>
      </div>

      <Card className="mica">
        <CardHeader>
          <CardTitle>所有用户</CardTitle>
          <CardDescription>管理系统中的所有用户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>组织</TableHead>
                <TableHead>课程数/选课数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    暂无用户
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'SUPER_ADMIN' ? '超级管理员' :
                         user.role === 'TEACHER' ? '教师' : '学生'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user.status === 'BANNED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status === 'ACTIVE' ? '活跃' :
                         user.status === 'BANNED' ? '已禁用' : '待审核'}
                      </span>
                    </TableCell>
                    <TableCell>{user.organization?.name || "-"}</TableCell>
                    <TableCell>
                      {user.role === 'TEACHER' 
                        ? `${user._count.coursesOwned} 课程`
                        : `${user._count.enrollments} 选课`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
