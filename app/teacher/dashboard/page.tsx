import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TeacherDashboard() {
  const session = await auth()
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  // Fetch real data from database
  const coursesCount = await prisma.course.count({
    where: { teacherId: session.user.id }
  })
  
  const pendingGradingCount = await prisma.submission.count({
    where: {
      assignment: {
        course: {
          teacherId: session.user.id
        }
      },
      status: 'SUBMITTED'
    }
  })

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">教师控制台</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="mica">
          <CardHeader>
            <CardTitle>我的课程</CardTitle>
            <CardDescription>您创建的所有课程</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coursesCount}</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader>
            <CardTitle>待批改作业</CardTitle>
            <CardDescription>等待批改的作业数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingGradingCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
