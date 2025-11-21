import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LayoutDashboard, Building2, Users, BookOpen, Settings } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <h2 className="text-xl font-bold">IntelliTeach Admin</h2>
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r mica flex flex-col md:min-h-screen">
        <div className="p-4 md:p-6 flex-1">
          <div className="hidden md:flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">IntelliTeach</h2>
            <ThemeToggle />
          </div>
          <nav className="space-y-1 md:space-y-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="w-full justify-start h-10 px-3">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>控制台</span>
              </Button>
            </Link>
            <Link href="/admin/organizations">
              <Button variant="ghost" className="w-full justify-start h-10 px-3">
                <Building2 className="mr-2 h-4 w-4" />
                <span>组织管理</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start h-10 px-3">
                <Users className="mr-2 h-4 w-4" />
                <span>用户管理</span>
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button variant="ghost" className="w-full justify-start h-10 px-3">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>课程管理</span>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="ghost" className="w-full justify-start h-10 px-3">
                <Settings className="mr-2 h-4 w-4" />
                <span>设置</span>
              </Button>
            </Link>
          </nav>
        </div>
        
        {/* User info and logout */}
        <div className="p-4 md:p-6 border-t">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <Button type="submit" variant="outline" className="w-full h-10">
              退出登录
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
