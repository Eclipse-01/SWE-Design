import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Info } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md mica shadow-xl">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            加入 IntelliTeach
          </CardTitle>
          <CardDescription className="text-center text-base">
            注册功能即将上线
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border/50 rounded-lg">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                需要账号？
              </p>
              <p className="text-sm text-muted-foreground">
                请联系您的组织管理员以获取账号和访问权限。我们正在开发自助注册功能，敬请期待。
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">已有账号</span>
            </div>
          </div>
          
          <Link href="/login" className="block">
            <Button className="w-full h-11 text-base font-medium">
              返回登录
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
