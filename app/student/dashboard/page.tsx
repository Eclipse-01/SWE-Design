import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Award, Clock } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale/zh-CN"

export default async function StudentDashboard() {
  const session = await auth()
  
  // Allow both STUDENT and SUPER_ADMIN
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // Fetch real data from database
  const enrollmentCount = await prisma.enrollment.count({
    where: session.user.role === 'SUPER_ADMIN' ? {} : { userId: session.user.id }
  })

  // Fix: Count pending assignments correctly - only those published and not yet submitted
  // Don't filter by deadline to show overdue assignments as well
  const pendingAssignmentCount = await prisma.assignment.count({
    where: session.user.role === 'SUPER_ADMIN' ? {
      status: 'PUBLISHED',
    } : {
      course: {
        enrollments: {
          some: {
            userId: session.user.id
          }
        }
      },
      status: 'PUBLISHED',
      submissions: {
        none: {
          studentId: session.user.id,
          status: {
            in: ['SUBMITTED', 'GRADED']
          }
        }
      }
    }
  })

  // Get graded submissions count
  const gradedCount = await prisma.submission.count({
    where: session.user.role === 'SUPER_ADMIN' ? {
      status: 'GRADED'
    } : {
      studentId: session.user.id,
      status: 'GRADED'
    }
  })

  // Get average score
  const submissions = await prisma.submission.findMany({
    where: session.user.role === 'SUPER_ADMIN' ? {
      status: 'GRADED',
      score: { not: null }
    } : {
      studentId: session.user.id,
      status: 'GRADED',
      score: { not: null }
    },
    select: {
      score: true
    }
  })

  const averageScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
    : 0

  // Get recent pending assignments
  const recentPendingAssignments = await prisma.assignment.findMany({
    where: session.user.role === 'SUPER_ADMIN' ? {
      status: 'PUBLISHED',
    } : {
      course: {
        enrollments: {
          some: {
            userId: session.user.id
          }
        }
      },
      status: 'PUBLISHED',
      submissions: {
        none: {
          studentId: session.user.id,
          status: {
            in: ['SUBMITTED', 'GRADED']
          }
        }
      }
    },
    include: {
      course: true
    },
    orderBy: {
      deadline: 'asc'
    },
    take: 5
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">学生中心</h1>
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
            <div className="text-2xl font-bold">{enrollmentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/student/courses" className="hover:underline">
                查看全部 →
              </Link>
            </p>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">待完成</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingAssignmentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingAssignmentCount > 0 ? '需要完成' : '暂无待完成作业'}
            </p>
          </CardContent>
        </Card>

        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">已批改</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              作业已评分
            </p>
          </CardContent>
        </Card>

        <Card className="mica">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">平均分</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {submissions.length > 0 ? `基于 ${submissions.length} 份作业` : '暂无评分'}
            </p>
          </CardContent>
        </Card>
      </div>

      {recentPendingAssignments.length > 0 && (
        <Card className="mica">
          <CardHeader>
            <CardTitle>待完成作业</CardTitle>
            <CardDescription>按截止时间排序</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>作业标题</TableHead>
                    <TableHead className="hidden sm:table-cell">课程</TableHead>
                    <TableHead>截止时间</TableHead>
                    <TableHead className="hidden md:table-cell">状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPendingAssignments.map((assignment) => {
                    const isOverdue = new Date() > new Date(assignment.deadline)
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{assignment.course.name}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(assignment.deadline), 'MM月dd日 HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={isOverdue ? "destructive" : "secondary"}>
                            {isOverdue ? '已截止' : '进行中'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/student/courses/${assignment.courseId}/assignments/${assignment.id}`}>
                            <Button variant="outline" size="sm" disabled={isOverdue}>
                              {isOverdue ? '已截止' : '提交'}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
