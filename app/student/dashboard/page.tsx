import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">学生中心</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="mica">
          <CardHeader>
            <CardTitle>我的课程</CardTitle>
            <CardDescription>您参与的所有课程</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enrollmentCount}</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader>
            <CardTitle>待完成作业</CardTitle>
            <CardDescription>需要提交的作业</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingAssignmentCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
