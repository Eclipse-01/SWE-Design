import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, FileTextIcon } from "lucide-react"

export default async function StudentCoursePage({
  params
}: {
  params: { courseId: string }
}) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  const course = await prisma.course.findUnique({
    where: { idString: params.courseId },
    include: {
      teacher: {
        select: { name: true, email: true }
      },
      assignments: {
        where: {
          status: 'PUBLISHED'
        },
        orderBy: {
          deadline: 'asc'
        },
        include: {
          submissions: {
            where: {
              studentId: session.user.id
            }
          }
        }
      }
    }
  })

  if (!course) {
    redirect('/student/courses')
  }

  // Verify enrollment
  if (session.user.role === 'STUDENT') {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.idString
        }
      }
    })

    if (!enrollment) {
      redirect('/student/courses')
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{course.name}</h1>
          <p className="text-muted-foreground">{course.code} • {course.teacher.name}</p>
        </div>
        <Link href="/student/courses" className="w-full md:w-auto">
          <Button variant="outline" className="w-full md:w-auto">返回课程列表</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 mica">
          <CardHeader>
            <CardTitle>作业列表</CardTitle>
            <CardDescription>查看并提交您的作业</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.assignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无作业</p>
            ) : (
              course.assignments.map((assignment) => {
                const submission = assignment.submissions[0]
                const isSubmitted = !!submission
                const isLate = new Date() > new Date(assignment.deadline)
                
                return (
                  <Link 
                    key={assignment.id} 
                    href={`/student/courses/${course.idString}/assignments/${assignment.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{assignment.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            截止: {new Date(assignment.deadline).toLocaleDateString('zh-CN')}
                          </span>
                          <span>满分: {assignment.maxScore}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubmitted ? (
                          <Badge variant={submission.status === 'GRADED' ? 'default' : 'secondary'}>
                            {submission.status === 'GRADED' ? `已评分: ${submission.score}` : '已提交'}
                          </Badge>
                        ) : isLate ? (
                          <Badge variant="destructive">已截止</Badge>
                        ) : (
                          <Badge variant="outline">未提交</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="mica h-fit">
          <CardHeader>
            <CardTitle>课程信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">课程描述</h4>
              <p className="text-sm text-muted-foreground">
                {course.description || "暂无描述"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">教师联系方式</h4>
              <p className="text-sm text-muted-foreground">
                {course.teacher.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
