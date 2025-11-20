import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { AssignmentActions } from "@/components/assignments/assignment-actions"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string }
}) {
  const session = await auth()
  
  // Allow both TEACHER and SUPER_ADMIN
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // Get course details
  const course = await prisma.course.findUnique({
    where: { idString: params.courseId },
    include: {
      organization: true,
      teacher: {
        select: {
          name: true,
          email: true,
        }
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        }
      }
    }
  })

  if (!course) {
    redirect('/teacher/courses')
  }

  // Verify ownership (unless super admin)
  if (session.user.role === 'TEACHER' && course.teacherId !== session.user.id) {
    redirect('/unauthorized')
  }

  // Get assignments for this course
  const assignments = await prisma.assignment.findMany({
    where: { courseId: params.courseId },
    include: {
      _count: {
        select: {
          submissions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: params.courseId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: { joinedAt: 'desc' }
  })

  return (
    <div className="p-8">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/teacher/courses" className="text-sm text-muted-foreground hover:underline mb-2 block">
              ← 返回课程列表
            </Link>
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <p className="text-muted-foreground">课程代码: {course.code}</p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm ${
              course.archived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
            }`}>
              {course.archived ? '已归档' : '活跃'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">学生数量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course._count.enrollments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">作业数量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course._count.assignments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">所属组织</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{course.organization.name}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList>
          <TabsTrigger value="assignments">作业管理</TabsTrigger>
          <TabsTrigger value="students">学生管理</TabsTrigger>
          <TabsTrigger value="settings">课程设置</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-6">
          <Card className="mica">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>作业列表</CardTitle>
                  <CardDescription>管理课程作业和任务</CardDescription>
                </div>
                <Link href={`/teacher/courses/${params.courseId}/assignments/create`}>
                  <Button>+ 创建作业</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>截止时间</TableHead>
                    <TableHead>最高分数</TableHead>
                    <TableHead>提交数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        暂无作业
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>
                          {format(new Date(assignment.deadline), 'PPP', { locale: zhCN })}
                        </TableCell>
                        <TableCell>{assignment.maxScore}</TableCell>
                        <TableCell>{assignment._count.submissions}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            assignment.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status === 'PUBLISHED' ? '已发布' :
                             assignment.status === 'DRAFT' ? '草稿' : '已归档'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <AssignmentActions
                            assignmentId={assignment.id}
                            assignmentTitle={assignment.title}
                            courseId={params.courseId}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <Card className="mica">
            <CardHeader>
              <CardTitle>选课学生</CardTitle>
              <CardDescription>查看已选修此课程的学生</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>加入时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        暂无学生选修此课程
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.user.name}</TableCell>
                        <TableCell>{enrollment.user.email}</TableCell>
                        <TableCell>
                          {format(new Date(enrollment.joinedAt), 'PPP', { locale: zhCN })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="mica">
            <CardHeader>
              <CardTitle>课程设置</CardTitle>
              <CardDescription>管理课程基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">课程信息</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">课程名称:</span> {course.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">课程代码:</span> {course.code}
                  </div>
                  <div>
                    <span className="text-muted-foreground">授课教师:</span> {course.teacher.name}
                  </div>
                  {course.description && (
                    <div>
                      <span className="text-muted-foreground">课程描述:</span>
                      <p className="mt-1">{course.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
