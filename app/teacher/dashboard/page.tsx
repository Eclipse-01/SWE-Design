import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Users, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale/zh-CN"

export default async function TeacherDashboard() {
  const session = await auth()
  
  // Allow both TEACHER and SUPER_ADMIN
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // Fetch real data from database
  const coursesCount = await prisma.course.count({
    where: session.user.role === 'SUPER_ADMIN' ? {} : { teacherId: session.user.id }
  })
  
  const pendingGradingCount = await prisma.submission.count({
    where: session.user.role === 'SUPER_ADMIN' ? {
      status: 'SUBMITTED'
    } : {
      assignment: {
        course: {
          teacherId: session.user.id
        }
      },
      status: 'SUBMITTED'
    }
  })

  // Get total students across all courses
  const totalStudents = await prisma.enrollment.count({
    where: session.user.role === 'SUPER_ADMIN' ? {} : {
      course: {
        teacherId: session.user.id
      }
    }
  })

  // Get total assignments
  const totalAssignments = await prisma.assignment.count({
    where: session.user.role === 'SUPER_ADMIN' ? {} : {
      course: {
        teacherId: session.user.id
      }
    }
  })

  // Get recent assignments with submissions needing grading
  const recentPendingAssignments = await prisma.assignment.findMany({
    where: session.user.role === 'SUPER_ADMIN' ? {
      submissions: {
        some: {
          status: 'SUBMITTED'
        }
      }
    } : {
      course: {
        teacherId: session.user.id
      },
      submissions: {
        some: {
          status: 'SUBMITTED'
        }
      }
    },
    include: {
      course: true,
      _count: {
        select: {
          submissions: {
            where: {
              status: 'SUBMITTED'
            }
          }
        }
      }
    },
    orderBy: {
      deadline: 'asc'
    },
    take: 5
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">教师控制台</h1>
        <p className="text-sm sm:text-base text-muted-foreground">欢迎回来，{session.user.name}</p>
      </div>
      
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">我的课程</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coursesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/teacher/courses" className="hover:underline">
                查看全部 →
              </Link>
            </p>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">待批改</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingGradingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingGradingCount > 0 ? '需要批改' : '暂无待批改作业'}
            </p>
          </CardContent>
        </Card>

        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">学生总数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有课程
            </p>
          </CardContent>
        </Card>

        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">作业总数</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              已发布作业
            </p>
          </CardContent>
        </Card>
      </div>

      {recentPendingAssignments.length > 0 && (
        <Card className="mica">
          <CardHeader>
            <CardTitle>待批改作业</CardTitle>
            <CardDescription>最近有学生提交的作业</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>作业标题</TableHead>
                    <TableHead className="hidden sm:table-cell">课程</TableHead>
                    <TableHead>截止时间</TableHead>
                    <TableHead className="hidden md:table-cell">待批改数</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPendingAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell className="hidden sm:table-cell">{assignment.course.name}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(assignment.deadline), 'MM月dd日 HH:mm', { locale: zhCN })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">
                          {assignment._count.submissions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/teacher/courses/${assignment.courseId}/assignments/${assignment.id}`}>
                          <Button variant="outline" size="sm">批改</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
