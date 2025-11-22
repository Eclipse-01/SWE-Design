"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, Settings, Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  role: "student" | "teacher" | "admin"
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname()

  const getLinks = () => {
    if (role === "admin") {
      return [
        {
          href: "/admin/dashboard",
          label: "控制台",
          icon: LayoutDashboard,
        },
        {
          href: "/admin/organizations",
          label: "组织",
          icon: Building2,
        },
        {
          href: "/admin/users",
          label: "用户",
          icon: Users,
        },
        {
          href: "/admin/courses",
          label: "课程",
          icon: BookOpen,
        },
        {
          href: "/admin/settings",
          label: "设置",
          icon: Settings,
        },
      ]
    }

    return [
      {
        href: `/${role}/dashboard`,
        label: role === "student" ? "学习中心" : "控制台",
        icon: LayoutDashboard,
      },
      {
        href: `/${role}/courses`,
        label: "我的课程",
        icon: BookOpen,
      },
      {
        href: `/${role}/settings`,
        label: "设置",
        icon: Settings,
      },
    ]
  }

  const links = getLinks()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden pb-safe">
      <nav className="flex h-16 items-center justify-around px-4">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
