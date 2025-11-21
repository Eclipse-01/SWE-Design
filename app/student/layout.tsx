import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LayoutDashboard, BookOpen, Settings } from "lucide-react"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  // Allow both STUDENT and SUPER_ADMIN to access student views
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <h2 className="text-xl font-bold">IntelliTeach</h2>
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 acrylic border-r flex flex-col md:m-2 md:rounded-lg md:h-[calc(100vh-1rem)] md:sticky md:top-2">
        <div className="p-4 md:p-6 flex-1">
          <div className="hidden md:flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-bold">IntelliTeach</h2>
            <ThemeToggle />
          </div>
          <nav className="space-y-1">
            <Link href="/student/dashboard">
              <Button variant="ghost" className="w-full justify-start text-base font-normal h-10 px-3">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>学习中心</span>
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button variant="ghost" className="w-full justify-start text-base font-normal h-10 px-3">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>我的课程</span>
              </Button>
            </Link>
            <Link href="/student/settings">
              <Button variant="ghost" className="w-full justify-start text-base font-normal h-10 px-3">
                <Settings className="mr-2 h-4 w-4" />
                <span>设置</span>
              </Button>
            </Link>
          </nav>
        </div>
        
        {/* User info and logout */}
        <div className="p-4 border-t border-border/50">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <Button type="submit" variant="outline" className="w-full justify-start h-10">
              退出登录
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-0 md:p-2 overflow-auto md:h-screen">
        <div className="h-full md:rounded-lg bg-background/50 md:backdrop-blur-sm md:border md:border-white/10 md:shadow-sm overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
