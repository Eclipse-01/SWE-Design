import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()
  
  // Allow both STUDENT and SUPER_ADMIN
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  const page = Number(searchParams.page) || 1
  const perPage = 20
  const skip = (page - 1) * perPage

  // For SUPER_ADMIN, show all enrollments; for STUDENT, show only their enrollments
  const where = session.user.role === 'SUPER_ADMIN' ? {} : {
    userId: session.user.id
  }

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            teacher: {
              select: {
                name: true
              }
            },
            organization: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                assignments: true
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: perPage
    }),
    prisma.enrollment.count({ where })
  ])

  const pagination = {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的课程</h1>
        <Link href="/student/courses/join">
          <Button>加入课程</Button>
        </Link>
      </div>

      <Card className="mica">
        <CardHeader>
          <CardTitle>选课列表</CardTitle>
          <CardDescription>您参与的所有课程</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程名称</TableHead>
                <TableHead>课程代码</TableHead>
                <TableHead>教师</TableHead>
                <TableHead>组织</TableHead>
                <TableHead>作业数</TableHead>
                <TableHead>加入时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    暂无课程
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      <Link href={`/student/courses/${enrollment.course.idString}`} className="hover:underline text-primary">
                        {enrollment.course.name}
                      </Link>
                    </TableCell>
                    <TableCell>{enrollment.course.code}</TableCell>
                    <TableCell>{enrollment.course.teacher.name}</TableCell>
                    <TableCell>{enrollment.course.organization.name}</TableCell>
                    <TableCell>{enrollment.course._count.assignments}</TableCell>
                    <TableCell>{new Date(enrollment.joinedAt).toLocaleDateString('zh-CN')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                显示第 {(pagination.page - 1) * pagination.perPage + 1} - {Math.min(pagination.page * pagination.perPage, pagination.total)} 条，共 {pagination.total} 条
              </div>
              <div className="flex gap-2">
                <Link href={`/student/courses?page=${pagination.page - 1}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pagination.page === 1}
                  >
                    上一页
                  </Button>
                </Link>
                <div className="flex items-center gap-1 text-sm">
                  第 {pagination.page} / {pagination.totalPages} 页
                </div>
                <Link href={`/student/courses?page=${pagination.page + 1}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    下一页
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
