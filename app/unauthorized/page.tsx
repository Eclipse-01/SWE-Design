import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md mica">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-destructive">
            访问被拒绝
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            您的账号已被封禁或您没有权限访问此页面。
          </p>
          <Link href="/">
            <Button className="w-full">返回首页</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
