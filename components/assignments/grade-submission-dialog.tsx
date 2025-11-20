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
import { gradeSubmission, gradeSubmissionWithAIAction } from "@/app/actions/assignments"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"

interface GradeSubmissionDialogProps {
  submissionId: string
  studentName: string
  submissionContent: string
  maxScore: number
  currentScore?: number | null
  currentFeedback?: string | null
}

export function GradeSubmissionDialog({ 
  submissionId, 
  studentName,
  submissionContent,
  maxScore,
  currentScore,
  currentFeedback 
}: GradeSubmissionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await gradeSubmission(formData)

    if (result.success) {
      toast.success("批改成功")
      setOpen(false)
    } else {
      toast.error(result.error || "批改失败")
    }

    setLoading(false)
  }

  async function handleAIGrade() {
    setAiLoading(true)
    
    try {
      const result = await gradeSubmissionWithAIAction(submissionId)
      
      if (result.success && result.result) {
        toast.success("AI批改完成")
        // Update form fields with AI results
        const scoreInput = document.getElementById('score') as HTMLInputElement
        const feedbackTextarea = document.getElementById('teacherFeedback') as HTMLTextAreaElement
        
        if (scoreInput) scoreInput.value = result.result.score.toString()
        if (feedbackTextarea) {
          let feedback = result.result.feedback
          if (result.result.strengths.length > 0) {
            feedback += `\n\n优点：\n${result.result.strengths.map(s => `- ${s}`).join('\n')}`
          }
          if (result.result.weaknesses.length > 0) {
            feedback += `\n\n不足：\n${result.result.weaknesses.map(w => `- ${w}`).join('\n')}`
          }
          feedbackTextarea.value = feedback
        }
        
        setOpen(false)
      } else {
        toast.error(result.error || "AI批改失败")
      }
    } catch (error) {
      toast.error("AI批改失败，请稍后重试")
    }
    
    setAiLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">批改</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="submissionId" value={submissionId} />
          <DialogHeader>
            <DialogTitle>批改作业 - {studentName}</DialogTitle>
            <DialogDescription>
              评分并提供反馈
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>学生提交内容</Label>
              <div className="p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{submissionContent}</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="score">分数 * (满分: {maxScore})</Label>
              <Input
                id="score"
                name="score"
                type="number"
                defaultValue={currentScore || ""}
                min="0"
                max={maxScore}
                required
                placeholder="0-100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacherFeedback">教师评语</Label>
              <Textarea
                id="teacherFeedback"
                name="teacherFeedback"
                defaultValue={currentFeedback || ""}
                placeholder="请输入评语..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleAIGrade}
              disabled={loading || aiLoading}
              className="w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {aiLoading ? "AI批改中..." : "使用AI批改"}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                disabled={loading || aiLoading}
                className="flex-1 sm:flex-none"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={loading || aiLoading}
                className="flex-1 sm:flex-none"
              >
                {loading ? "提交中..." : "提交批改"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
