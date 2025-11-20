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
import { updateAssignment } from "@/app/actions/assignments"
import { toast } from "sonner"
import { format } from "date-fns"

interface EditAssignmentDialogProps {
  assignmentId: string
  currentTitle: string
  currentDescription: string
  currentDeadline: Date
  currentMaxScore: number
}

export function EditAssignmentDialog({ 
  assignmentId, 
  currentTitle, 
  currentDescription,
  currentDeadline,
  currentMaxScore 
}: EditAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateAssignment(assignmentId, formData)

    if (result.success) {
      toast.success("作业更新成功")
      setOpen(false)
    } else {
      toast.error(result.error || "更新失败")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">编辑</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>编辑作业</DialogTitle>
            <DialogDescription>
              修改作业信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">作业标题 *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={currentTitle}
                required
                placeholder="例如：第一次作业"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">作业描述 *</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={currentDescription}
                required
                placeholder="作业要求..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline">截止时间 *</Label>
              <Input
                id="deadline"
                name="deadline"
                type="datetime-local"
                defaultValue={format(new Date(currentDeadline), "yyyy-MM-dd'T'HH:mm")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxScore">最高分数 *</Label>
              <Input
                id="maxScore"
                name="maxScore"
                type="number"
                defaultValue={currentMaxScore}
                min="1"
                max="100"
                required
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
