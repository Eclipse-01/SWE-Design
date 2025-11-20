import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function StudentCoursesPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/unauthorized')
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id
    },
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
    orderBy: { joinedAt: 'desc' }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的课程</h1>
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
                    <TableCell className="font-medium">{enrollment.course.name}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
