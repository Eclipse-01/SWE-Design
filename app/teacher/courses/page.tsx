import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TeacherCoursesPage() {
  const session = await auth()
  
  // Allow both TEACHER and SUPER_ADMIN
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // For SUPER_ADMIN, show all courses; for TEACHER, show only their courses
  const courses = await prisma.course.findMany({
    where: session.user.role === 'SUPER_ADMIN' ? {} : {
      teacherId: session.user.id
    },
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
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的课程</h1>
      </div>

      <Card className="mica">
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
          <CardDescription>管理您创建的所有课程</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程名称</TableHead>
                <TableHead>课程代码</TableHead>
                <TableHead>组织</TableHead>
                <TableHead>学生数</TableHead>
                <TableHead>作业数</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    暂无课程
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.idString}>
                    <TableCell className="font-medium">{course.name}</TableCell>
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
