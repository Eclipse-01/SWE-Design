"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateCourse } from "@/app/actions/courses"
import { toast } from "sonner"

interface EditCourseDialogProps {
  courseId: string
  currentName: string
  currentDescription?: string | null
}

export function EditCourseDialog({ courseId, currentName, currentDescription }: EditCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateCourse(courseId, formData)

    if (result.success) {
      toast.success("课程更新成功")
      setOpen(false)
    } else {
      toast.error(result.error || "更新失败")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">编辑课程</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>编辑课程</DialogTitle>
            <DialogDescription>
              修改课程名称和描述
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">课程名称 *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={currentName}
                required
                placeholder="例如：软件工程2024秋"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">课程描述</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={currentDescription || ""}
                placeholder="课程简介..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
