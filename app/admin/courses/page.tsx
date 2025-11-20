import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CourseActions } from "@/components/courses/course-actions"

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  const page = Number(searchParams.page) || 1
  const perPage = 20
  const skip = (page - 1) * perPage

  // Show all courses for admin
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      include: {
        organization: {
          select: {
            name: true
          }
        },
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage
    }),
    prisma.course.count()
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
        <h1 className="text-3xl font-bold">课程管理</h1>
      </div>

      <Card className="mica">
        <CardHeader>
          <CardTitle>全部课程</CardTitle>
          <CardDescription>查看和管理系统中的所有课程</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程名称</TableHead>
                <TableHead>课程代码</TableHead>
                <TableHead>教师</TableHead>
                <TableHead>组织</TableHead>
                <TableHead>学生数</TableHead>
                <TableHead>作业数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    暂无课程
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.idString}>
                    <TableCell className="font-medium">
                      <Link href={`/teacher/courses/${course.idString}`} className="hover:underline">
                        {course.name}
                      </Link>
                    </TableCell>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>{course.teacher.name}</TableCell>
                    <TableCell>{course.organization.name}</TableCell>
                    <TableCell>{course._count.enrollments}</TableCell>
                    <TableCell>{course._count.assignments}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        course.archived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {course.archived ? '已归档' : '活跃'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <CourseActions
                        courseId={course.idString}
                        courseName={course.name}
                        isArchived={course.archived}
                      />
                    </TableCell>
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
                <Link href={`/admin/courses?page=${pagination.page - 1}`}>
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
                <Link href={`/admin/courses?page=${pagination.page + 1}`}>
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
