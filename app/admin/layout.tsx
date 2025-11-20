import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r mica">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">IntelliTeach</h2>
          <nav className="space-y-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                📊 控制台
              </Button>
            </Link>
            <Link href="/admin/organizations">
              <Button variant="ghost" className="w-full justify-start">
                🏢 组织管理
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start">
                👥 用户管理
              </Button>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}
