"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { joinCourse } from "@/app/actions/enrollments"
import { toast } from "sonner"

export default function JoinCoursePage() {
  const router = useRouter()
  const [courseCode, setCourseCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseCode.trim()) {
      toast.error("请输入课程代码")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await joinCourse(courseCode)
      
      if (result.success) {
        toast.success("成功加入课程！")
        router.push("/student/courses")
      } else {
        toast.error(result.error || "加入课程失败")
      }
    } catch (error) {
      toast.error("发生错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/student/courses">
            <Button variant="ghost">← 返回课程列表</Button>
          </Link>
        </div>

        <Card className="mica">
          <CardHeader>
            <CardTitle>加入课程</CardTitle>
            <CardDescription>输入课程代码以加入课程</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseCode">课程代码 *</Label>
                <Input 
                  id="courseCode" 
                  placeholder="例如: CS101" 
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  disabled={isLoading}
                  required 
                />
                <p className="text-sm text-muted-foreground">
                  请向您的教师获取课程代码
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "加入中..." : "加入课程"}
                </Button>
                <Link href="/student/courses">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    取消
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
