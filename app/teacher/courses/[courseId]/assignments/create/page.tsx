"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { createAssignment } from "@/app/actions/assignments"
import { toast } from "sonner"

export default function CreateAssignmentPage({
  params,
}: {
  params: { courseId: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("courseId", params.courseId)
      
      const result = await createAssignment(formData)
      
      if (result.success) {
        toast.success("作业创建成功")
        router.push(`/teacher/courses/${params.courseId}`)
        router.refresh()
      } else {
        toast.error(result.error || "创建失败")
      }
    } catch (error) {
      toast.error("创建失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href={`/teacher/courses/${params.courseId}`} className="text-sm text-muted-foreground hover:underline">
          ← 返回课程详情
        </Link>
        <h1 className="text-3xl font-bold mt-2">创建作业</h1>
      </div>

      <Card className="mica max-w-2xl">
        <CardHeader>
          <CardTitle>新建作业</CardTitle>
          <CardDescription>填写作业信息并发布给学生</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">作业标题 *</Label>
              <Input
                id="title"
                name="title"
                placeholder="例如：第一章课后练习"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">作业描述 *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="详细描述作业要求和内容..."
                rows={6}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">截止时间 *</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxScore">最高分数 *</Label>
                <Input
                  id="maxScore"
                  name="maxScore"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue="100"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "创建中..." : "创建作业"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
