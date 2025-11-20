import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { updateOrganizationSubscription } from "@/app/actions/organizations"
import { revalidatePath } from "next/cache"

export default async function EditOrganizationPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  const organization = await prisma.organization.findUnique({
    where: { idString: params.id },
    include: {
      _count: {
        select: { users: true, courses: true }
      }
    }
  })

  if (!organization) {
    redirect('/admin/organizations')
  }

  async function handleUpdate(formData: FormData) {
    "use server"
    
    const aiSubStatus = formData.get("aiSubStatus") as 'ACTIVE' | 'EXPIRED' | 'INACTIVE'
    const aiTokenLimit = Number(formData.get("aiTokenLimit"))
    const aiSubEndDate = formData.get("aiSubEndDate") 
      ? new Date(formData.get("aiSubEndDate") as string)
      : null

    await updateOrganizationSubscription(
      params.id,
      aiSubStatus,
      aiSubEndDate,
      aiTokenLimit
    )

    revalidatePath('/admin/organizations')
    redirect('/admin/organizations')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/admin/organizations" className="text-sm text-muted-foreground hover:underline mb-2 block">
          ← 返回组织列表
        </Link>
        <h1 className="text-3xl font-bold">编辑组织 - {organization.name}</h1>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>组织名称</Label>
              <div className="text-lg font-semibold mt-1">{organization.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>用户数</Label>
                <div className="text-2xl font-bold mt-1">{organization._count.users}</div>
              </div>
              <div>
                <Label>课程数</Label>
                <div className="text-2xl font-bold mt-1">{organization._count.courses}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI 订阅设置</CardTitle>
            <CardDescription>配置组织的AI功能和Token使用限制</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiSubStatus">订阅状态</Label>
                <Select name="aiSubStatus" defaultValue={organization.aiSubStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择订阅状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">激活</SelectItem>
                    <SelectItem value="INACTIVE">未订阅</SelectItem>
                    <SelectItem value="EXPIRED">已过期</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiTokenLimit">Token 限制 (每月)</Label>
                <Input
                  id="aiTokenLimit"
                  name="aiTokenLimit"
                  type="number"
                  defaultValue={organization.aiTokenLimit}
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  当前已使用: {organization.aiTokenUsage} / {organization.aiTokenLimit}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiSubEndDate">订阅截止日期 (可选)</Label>
                <Input
                  id="aiSubEndDate"
                  name="aiSubEndDate"
                  type="date"
                  defaultValue={
                    organization.aiSubEndDate 
                      ? new Date(organization.aiSubEndDate).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">保存设置</Button>
                <Link href="/admin/organizations">
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
