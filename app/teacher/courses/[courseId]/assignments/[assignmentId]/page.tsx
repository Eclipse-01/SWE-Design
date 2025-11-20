import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { GradeSubmissionDialog } from "@/components/assignments/grade-submission-dialog"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale/zh-CN"
import { Badge } from "@/components/ui/badge"

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: { courseId: string; assignmentId: string }
}) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // Get assignment details
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: {
      course: {
        include: {
          teacher: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  })

  if (!assignment || assignment.courseId !== params.courseId) {
    redirect('/teacher/courses')
  }

  // Verify ownership (unless super admin)
  if (session.user.role === 'TEACHER' && assignment.course.teacherId !== session.user.id) {
    redirect('/unauthorized')
  }

  // Get all submissions for this assignment
  const submissions = await prisma.submission.findMany({
    where: { assignmentId: params.assignmentId },
    include: {
      student: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/teacher/courses/${params.courseId}`} 
          className="text-sm text-muted-foreground hover:underline mb-2 block"
        >
          ← 返回课程
        </Link>
        <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
        <p className="text-muted-foreground">{assignment.course.name}</p>
      </div>

      {/* Assignment Info */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">截止时间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(assignment.deadline), "MM月dd日 HH:mm", { locale: zhCN })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">最高分数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignment.maxScore} 分</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">提交情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.length} 份
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              已批改: {submissions.filter(s => s.status === 'GRADED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>学生提交</CardTitle>
          <CardDescription>查看和批改学生作业</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>分数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    暂无提交
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.student.name}
                      <div className="text-xs text-muted-foreground">{submission.student.email}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(submission.submittedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      {submission.status === 'GRADED' ? (
                        <Badge variant="default">已批改</Badge>
                      ) : submission.status === 'SUBMITTED' ? (
                        <Badge variant="secondary">待批改</Badge>
                      ) : (
                        <Badge variant="outline">未提交</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.score !== null ? (
                        <span className="font-semibold">{submission.score} / {assignment.maxScore}</span>
                      ) : (
                        <span className="text-muted-foreground">未评分</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <GradeSubmissionDialog
                        submissionId={submission.id}
                        studentName={submission.student.name}
                        submissionContent={submission.content}
                        maxScore={assignment.maxScore}
                        currentScore={submission.score}
                        currentFeedback={submission.teacherFeedback}
                      />
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
