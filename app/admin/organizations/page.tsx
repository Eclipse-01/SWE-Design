import { getOrganizations } from "@/app/actions/organizations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function OrganizationsPage() {
  const organizations = await getOrganizations()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">组织管理</h1>
        <Link href="/admin/organizations/create">
          <Button>创建组织</Button>
        </Link>
      </div>

      <Card className="mica">
        <CardHeader>
          <CardTitle>所有组织</CardTitle>
          <CardDescription>管理系统中的所有教育机构</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>组织名称</TableHead>
                <TableHead>AI 订阅状态</TableHead>
                <TableHead>Token 使用情况</TableHead>
                <TableHead>用户数</TableHead>
                <TableHead>课程数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    暂无组织
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.idString}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        org.aiSubStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        org.aiSubStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {org.aiSubStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {org.aiTokenUsage} / {org.aiTokenLimit}
                    </TableCell>
                    <TableCell>{org._count.users}</TableCell>
                    <TableCell>{org._count.courses}</TableCell>
                    <TableCell>
                      <Link href={`/admin/organizations/${org.idString}/edit`}>
                        <Button variant="ghost" size="sm">编辑</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
