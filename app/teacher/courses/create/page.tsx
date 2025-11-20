import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createCourse } from "@/app/actions/courses"
import Link from "next/link"

export default async function CreateCoursePage() {
  const session = await auth()
  
  // Allow both TEACHER and SUPER_ADMIN
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  // Teachers must have an organization
  if (session.user.role === 'TEACHER' && !session.user.organizationId) {
    redirect('/unauthorized')
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/teacher/courses">
            <Button variant="ghost">← 返回课程列表</Button>
          </Link>
        </div>

        <Card className="mica">
          <CardHeader>
            <CardTitle>创建课程</CardTitle>
            <CardDescription>创建新课程，课程代码将自动生成</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCourse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">课程名称 *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="例如: 软件工程2024秋" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">课程描述</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="课程简介和说明（可选）"
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  💡 课程代码将自动生成为8位大写字母和数字的组合，创建后将显示给您
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit">创建课程</Button>
                <Link href="/teacher/courses">
                  <Button type="button" variant="outline">取消</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
