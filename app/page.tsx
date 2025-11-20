import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            IntelliTeach
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            智能教学辅助系统 - 基于 AI 的 SaaS 多租户教学管理平台
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="/register">注册</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          核心功能
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="mica">
            <CardHeader>
              <CardTitle>多租户管理</CardTitle>
              <CardDescription>支持多组织隔离管理，数据安全可靠</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                为不同教育机构提供独立的管理空间，确保数据隔离和安全性
              </p>
            </CardContent>
          </Card>

          <Card className="mica">
            <CardHeader>
              <CardTitle>AI 智能批改</CardTitle>
              <CardDescription>基于智谱AI GLM-4-Flash的自动化作业批改</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                利用先进的 AI 技术，为教师提供智能化的作业批改建议和反馈
              </p>
            </CardContent>
          </Card>

          <Card className="mica">
            <CardHeader>
              <CardTitle>课程作业管理</CardTitle>
              <CardDescription>完整的课程-作业二级管理架构</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                教师创建课程并发布作业，学生在线提交，系统自动追踪进度
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          定价方案
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="mica">
            <CardHeader>
              <CardTitle>基础版</CardTitle>
              <CardDescription>适合小型教学机构</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">¥999<span className="text-sm font-normal">/月</span></div>
              <ul className="space-y-2 text-sm">
                <li>✓ 50,000 AI Token/月</li>
                <li>✓ 最多 100 名用户</li>
                <li>✓ 基础功能支持</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mica border-primary">
            <CardHeader>
              <CardTitle>专业版</CardTitle>
              <CardDescription>推荐给中型机构</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">¥2,999<span className="text-sm font-normal">/月</span></div>
              <ul className="space-y-2 text-sm">
                <li>✓ 100,000 AI Token/月</li>
                <li>✓ 最多 500 名用户</li>
                <li>✓ 优先技术支持</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mica">
            <CardHeader>
              <CardTitle>企业版</CardTitle>
              <CardDescription>面向大型教育机构</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">定制<span className="text-sm font-normal"></span></div>
              <ul className="space-y-2 text-sm">
                <li>✓ 无限 AI Token</li>
                <li>✓ 无限用户数</li>
                <li>✓ 专属客户经理</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <p className="text-center text-gray-600 dark:text-gray-400">
          © 2024 IntelliTeach. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
