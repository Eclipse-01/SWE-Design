import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session || (session.user as any).role !== 'STUDENT') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r mica">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">IntelliTeach</h2>
          <nav className="space-y-2">
            <Link href="/student/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                📊 学习中心
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button variant="ghost" className="w-full justify-start">
                📚 我的课程
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
