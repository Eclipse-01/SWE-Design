import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar */}
      <aside className="w-64 acrylic border-r flex flex-col m-2 rounded-lg h-[calc(100vh-1rem)] sticky top-2">
        <div className="p-6 flex-1">
          <h2 className="text-2xl font-bold mb-8 px-2">IntelliTeach</h2>
          <nav className="space-y-1">
            <Link href="/student/dashboard">
              <Button variant="ghost" className="w-full justify-start text-base font-normal">
                <span className="mr-2">📊</span> 学习中心
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button variant="ghost" className="w-full justify-start text-base font-normal">
                <span className="mr-2">📚</span> 我的课程
              </Button>
            </Link>
          </nav>
        </div>
        
        {/* User info and logout */}
        <div className="p-4 border-t border-border/50">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <Button type="submit" variant="outline" className="w-full justify-start">
              <span className="mr-2">🚪</span> 退出登录
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-2 overflow-auto h-screen">
        <div className="h-full rounded-lg bg-background/50 backdrop-blur-sm border border-white/10 shadow-sm overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
