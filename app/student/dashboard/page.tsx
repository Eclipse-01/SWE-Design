import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StudentDashboard() {
  const session = await auth()
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/unauthorized')
  }

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
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card className="mica">
          <CardHeader>
            <CardTitle>待完成作业</CardTitle>
            <CardDescription>需要提交的作业</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
