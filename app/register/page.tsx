import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md mica">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">
            注册功能正在开发中
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            请联系您的组织管理员获取账号。
          </p>
          <Link href="/login">
            <Button className="w-full">返回登录</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
