"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"
import { Sun, Moon, Monitor, User, Mail, Lock, Palette, Bell } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

export default function TeacherSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [assignmentNotifications, setAssignmentNotifications] = useState(true)

  const handleSaveProfile = () => {
    toast.success("设置已保存")
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-2">管理您的账号设置和偏好</p>
      </div>

      <Separator />

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>主题设置</CardTitle>
          </div>
          <CardDescription>
            选择您喜欢的界面主题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                theme === "light" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Sun className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">浅色模式</p>
                <p className="text-xs text-muted-foreground">明亮清晰</p>
              </div>
            </button>
            
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                theme === "dark" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Moon className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">深色模式</p>
                <p className="text-xs text-muted-foreground">护眼舒适</p>
              </div>
            </button>
            
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                theme === "system" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Monitor className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">跟随系统</p>
                <p className="text-xs text-muted-foreground">自动适配</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>个人信息</CardTitle>
          </div>
          <CardDescription>
            更新您的个人信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="请输入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">电子邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">邮箱地址无法修改</p>
          </div>

          <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
            保存更改
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>通知设置</CardTitle>
          </div>
          <CardDescription>
            管理您的通知偏好
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">邮件通知</Label>
              <p className="text-xs text-muted-foreground">接收重要更新的邮件通知</p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="assignment-notifications">作业提交通知</Label>
              <p className="text-xs text-muted-foreground">学生提交作业时通知我</p>
            </div>
            <Switch
              id="assignment-notifications"
              checked={assignmentNotifications}
              onCheckedChange={setAssignmentNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>安全设置</CardTitle>
          </div>
          <CardDescription>
            管理您的密码和安全选项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full sm:w-auto">
            更改密码
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
