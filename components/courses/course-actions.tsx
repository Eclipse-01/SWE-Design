"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, Archive } from "lucide-react"
import { deleteCourse, archiveCourse } from "@/app/actions/courses"
import { toast } from "sonner"

interface CourseActionsProps {
  courseId: string
  courseName: string
  isArchived: boolean
}

export function CourseActions({ courseId, courseName, isArchived }: CourseActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCourse(courseId)
      if (result.success) {
        toast.success("课程已删除")
        router.refresh()
      } else {
        toast.error(result.error || "删除失败")
      }
    } catch (error) {
      toast.error("删除失败，请重试")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      const result = await archiveCourse(courseId)
      if (result.success) {
        toast.success("课程已归档")
        router.refresh()
      } else {
        toast.error(result.error || "归档失败")
      }
    } catch (error) {
      toast.error("归档失败，请重试")
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isArchived && (
            <DropdownMenuItem
              onClick={handleArchive}
              disabled={isArchiving}
            >
              <Archive className="mr-2 h-4 w-4" />
              {isArchiving ? "归档中..." : "归档课程"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除课程
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除课程</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除课程 &ldquo;{courseName}&rdquo; 吗？此操作将删除课程及其所有相关数据（包括作业、选课记录等），且无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
