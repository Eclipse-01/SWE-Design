import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createOrganization } from "@/app/actions/organizations"
import Link from "next/link"

export default async function CreateOrganizationPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/organizations">
            <Button variant="ghost">← 返回组织列表</Button>
          </Link>
        </div>

        <Card className="mica">
          <CardHeader>
            <CardTitle>创建组织</CardTitle>
            <CardDescription>添加新的教育机构到系统</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">组织名称 *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="例如: 清华大学" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">域名 (可选)</Label>
                <Input 
                  id="domain" 
                  name="domain" 
                  placeholder="例如: tsinghua.edu.cn" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiTokenLimit">AI Token 限制 *</Label>
                <Input 
                  id="aiTokenLimit" 
                  name="aiTokenLimit" 
                  type="number" 
                  placeholder="100000" 
                  defaultValue="100000"
                  required 
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit">创建组织</Button>
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
