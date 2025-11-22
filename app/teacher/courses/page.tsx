import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CourseActions } from "@/components/courses/course-actions"

export default async function TeacherCoursesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()
  
  // Allow both TEACHER and SUPER_ADMIN
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  const page = Number(searchParams.page) || 1
  const perPage = 20
  const skip = (page - 1) * perPage

  // For SUPER_ADMIN, show all courses; for TEACHER, show only their courses
  const where = session.user.role === 'SUPER_ADMIN' ? {} : {
    teacherId: session.user.id
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        organization: {
          select: {
            name: true
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
    prisma.course.count({ where })
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
        <Link href="/teacher/courses/create">
          <Button>+ 创建课程</Button>
        </Link>
      </div>

      <Card className="mica">
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
          <CardDescription>管理您创建的所有课程</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程名称</TableHead>
                  <TableHead>课程代码</TableHead>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {courses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无课程
              </div>
            ) : (
              courses.map((course) => (
                <Card key={course.idString} className="bg-card/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/teacher/courses/${course.idString}`} className="font-bold text-lg hover:underline block mb-1">
                          {course.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">{course.code}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        course.archived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {course.archived ? '已归档' : '活跃'}
                      </span>
                    </div>
                    
                    <div className="text-xs bg-secondary px-2 py-1 rounded inline-block">
                      {course.organization.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">学生:</span> {course._count.enrollments}
                      </div>
                      <div>
                        <span className="text-muted-foreground">作业:</span> {course._count.assignments}
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-end">
                      <CourseActions
                        courseId={course.idString}
                        courseName={course.name}
                        isArchived={course.archived}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                显示第 {(pagination.page - 1) * pagination.perPage + 1} - {Math.min(pagination.page * pagination.perPage, pagination.total)} 条，共 {pagination.total} 条
              </div>
              <div className="flex gap-2">
                <Link href={`/teacher/courses?page=${pagination.page - 1}`}>
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
                <Link href={`/teacher/courses?page=${pagination.page + 1}`}>
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
