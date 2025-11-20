import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardRedirect() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  // Redirect to role-specific dashboard
  if (session.user.role === 'SUPER_ADMIN') {
    redirect('/admin/dashboard')
  } else if (session.user.role === 'TEACHER') {
    redirect('/teacher/dashboard')
  } else if (session.user.role === 'STUDENT') {
    redirect('/student/dashboard')
  }
  
  // Fallback to home page if role is unknown
  redirect('/')
}
