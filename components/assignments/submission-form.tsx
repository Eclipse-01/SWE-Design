"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateSubmissionSchema } from "@/lib/validations"
import { submitAssignment } from "@/app/actions/assignments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { z } from "zod"
import { Loader2 } from "lucide-react"

type FormData = z.infer<typeof CreateSubmissionSchema>

interface SubmissionFormProps {
  assignmentId: string
  initialContent?: string
  isLate: boolean
}

export function SubmissionForm({ assignmentId, initialContent, isLate }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(CreateSubmissionSchema),
    defaultValues: {
      content: initialContent || "",
      assignmentId: assignmentId,
    },
  })

  async function onSubmit(data: FormData) {
    if (isLate) {
      toast.error("作业已截止，无法提交")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("content", data.content)
    formData.append("assignmentId", data.assignmentId)

    const result = await submitAssignment(formData)

    if (result.success) {
      toast.success("作业提交成功")
    } else {
      toast.error(result.error || "提交失败")
    }
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>作业内容</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="请输入您的作业内容..." 
                  className="min-h-[200px]" 
                  {...field} 
                  disabled={isLate}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || isLate} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLate ? "已截止" : "提交作业"}
        </Button>
      </form>
    </Form>
  )
}
