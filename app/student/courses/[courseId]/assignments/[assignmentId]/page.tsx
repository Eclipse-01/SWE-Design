import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ArrowLeftIcon, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { SubmissionForm } from "@/components/assignments/submission-form"
import { Separator } from "@/components/ui/separator"

export default async function AssignmentPage({
  params
}: {
  params: { courseId: string; assignmentId: string }
}) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: {
      course: true,
      submissions: {
        where: {
          studentId: session.user.id
        }
      }
    }
  })

  if (!assignment || assignment.courseId !== params.courseId) {
    redirect(`/student/courses/${params.courseId}`)
  }

  const submission = assignment.submissions[0]
  const isLate = new Date() > new Date(assignment.deadline)
  const canSubmit = !isLate || submission // Allow resubmission if already submitted? Or maybe just block if late.
  // Actually, usually late submission is allowed but marked late, or not allowed. 
  // Based on my action logic: if (new Date() > assignment.deadline) return error. So strict deadline.

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/student/courses/${params.courseId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">{assignment.course.name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="mica">
            <CardHeader>
              <CardTitle>作业详情</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  截止时间: {new Date(assignment.deadline).toLocaleString('zh-CN')}
                </span>
                <Badge variant={isLate ? "destructive" : "secondary"}>
                  {isLate ? "已截止" : "进行中"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{assignment.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mica">
            <CardHeader>
              <CardTitle>提交作业</CardTitle>
              <CardDescription>
                {submission ? "您已提交过此作业，可以再次提交以更新内容。" : "请在截止日期前提交您的作业。"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submission && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">上次提交状态</span>
                    <Badge>{submission.status === 'GRADED' ? '已评分' : '已提交'}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    提交时间: {new Date(submission.submittedAt).toLocaleString('zh-CN')}
                  </div>
                  {submission.score !== null && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex justify-between items-center font-medium">
                        <span>得分</span>
                        <span className="text-lg">{submission.score} / {assignment.maxScore}</span>
                      </div>
                      {submission.teacherFeedback && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">教师评语:</span>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{submission.teacherFeedback}</p>
                        </div>
                      )}
                      {submission.aiAnalysis && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">AI 分析</span>
                          </div>
                          {(submission.aiAnalysis as any).strengths && (submission.aiAnalysis as any).strengths.length > 0 && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                                <CheckCircle2 className="h-3 w-3" />
                                优点
                              </div>
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                                {(submission.aiAnalysis as any).strengths.map((strength: string, idx: number) => (
                                  <li key={idx}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {(submission.aiAnalysis as any).weaknesses && (submission.aiAnalysis as any).weaknesses.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                                <AlertCircle className="h-3 w-3" />
                                待改进
                              </div>
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                                {(submission.aiAnalysis as any).weaknesses.map((weakness: string, idx: number) => (
                                  <li key={idx}>{weakness}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(!isLate || submission) && (
                <SubmissionForm 
                  assignmentId={assignment.id} 
                  initialContent={submission?.content}
                  isLate={isLate}
                />
              )}
              
              {isLate && !submission && (
                <div className="text-center py-8 text-muted-foreground">
                  作业已截止，无法提交。
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="mica">
            <CardHeader>
              <CardTitle>评分标准</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center py-4">
                {assignment.maxScore} <span className="text-sm font-normal text-muted-foreground">分</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                请确保您的作业符合要求
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
