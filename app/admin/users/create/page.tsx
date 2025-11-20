import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser } from "@/app/actions/users"
import Link from "next/link"

export default async function CreateUserPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  // Fetch organizations for the dropdown
  const organizations = await prisma.organization.findMany({
    select: {
      idString: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/users">
            <Button variant="ghost">← 返回用户列表</Button>
          </Link>
        </div>

        <Card className="mica">
          <CardHeader>
            <CardTitle>创建用户</CardTitle>
            <CardDescription>添加新用户到系统</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="请输入姓名" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱 *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  placeholder="user@example.com" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password"
                  placeholder="至少6个字符" 
                  minLength={6}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">角色 *</Label>
                <select
                  id="role"
                  name="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">请选择角色</option>
                  <option value="TEACHER">教师</option>
                  <option value="STUDENT">学生</option>
                  <option value="SUPER_ADMIN">超级管理员</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationId">组织 *</Label>
                <select
                  id="organizationId"
                  name="organizationId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">请选择组织</option>
                  {organizations.map((org) => (
                    <option key={org.idString} value={org.idString}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  注意：教师和学生必须分配到组织
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit">创建用户</Button>
                <Link href="/admin/users">
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
