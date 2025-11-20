# IntelliTeach - 智能教学辅助系统

基于 Next.js 14+ 的企业级 SaaS 多租户教学管理平台

## 项目概述

IntelliTeach 是一个支持多组织隔离管理的智能教学辅助系统。系统采用"课程-作业"二级管理架构，集成 Google Gemini API 实现作业的自动化批改与反馈。

### 核心特性

- ✅ **SaaS 多租户架构** - 支持多个教育机构独立管理
- ✅ **AI 智能批改** - 基于 Google Gemini API 的自动化作业评分
- ✅ **课程作业管理** - 完整的二级管理架构
- ✅ **角色权限管理** - 支持超级管理员、教师、学生三种角色
- ✅ **数据隔离** - 严格的多租户数据隔离机制
- ✅ **全链路校验** - 基于 Zod 的输入验证
- ✅ **响应式设计** - Mobile First，支持多端访问

## 技术栈

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI System**: ShadCN UI (Radix UI + Tailwind CSS)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI Engine**: Google Gemini API (gemini-2.0-flash-exp)
- **Auth**: NextAuth.js v5
- **Forms**: React Hook Form + Zod

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安装步骤

1. 克隆仓库

```bash
git clone <repository-url>
cd SWE-Design
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下内容：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/intelliteach"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key-here"
```

4. 初始化数据库

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
.
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 超级管理员页面
│   ├── teacher/           # 教师页面
│   ├── student/           # 学生页面
│   ├── login/             # 登录页面
│   └── register/          # 注册页面
├── components/            # React 组件
│   └── ui/               # ShadCN UI 组件
├── lib/                   # 工具函数和配置
│   ├── db.ts             # Prisma 客户端
│   ├── auth-config.ts    # 认证配置
│   ├── validations.ts    # Zod 验证模式
│   └── gemini.ts         # Gemini AI 集成
├── prisma/               # Prisma 配置
│   └── schema.prisma     # 数据库模型
└── middleware.ts         # Next.js 中间件
```

## 数据库模型

系统包含以下核心模型：

- **Organization** - 组织（多租户）
- **User** - 用户（三种角色）
- **Course** - 课程
- **Enrollment** - 选课关系
- **Assignment** - 作业
- **Submission** - 提交

详细的数据库设计请参考 `prisma/schema.prisma`

## 功能模块

### 超级管理员

- 组织管理（创建、编辑、删除）
- 用户管理（批量导入、封禁/解禁）
- AI 订阅控制（Token 限制、续费管理）
- 系统概览（组织数、用户数、Token 消耗）

### 教师

- 课程管理（创建课程、发布作业）
- 作业批改（手动批改、AI 辅助批改）
- 学生管理（查看选课名单）
- 成绩统计

### 学生

- 课程选修（加入课程）
- 作业提交（文本+文件上传）
- 查看反馈（分数、AI 评语、教师评语）
- 成绩查询

## AI 批改功能

系统集成 Google Gemini API，提供智能化的作业批改功能：

1. **自动评分** - 基于作业要求自动生成分数
2. **优点分析** - 识别学生作业的优点
3. **不足指出** - 指出需要改进的地方
4. **综合反馈** - 提供详细的评价和建议

### 订阅守卫机制

系统实现了 AI Token 使用控制：

- 每个组织有 Token 使用限制
- 调用 AI 前检查额度
- 自动记录 Token 消耗
- 额度耗尽时拒绝调用

## 安全特性

- ✅ **Zod 全链路校验** - 所有输入数据严格验证
- ✅ **JWT 认证** - 基于 NextAuth.js 的安全认证
- ✅ **数据隔离** - 多租户数据严格隔离
- ✅ **密码加密** - bcrypt 加密存储
- ✅ **错误边界** - 优雅的错误处理

## 开发指南

### 添加新页面

1. 在 `app/` 目录下创建新路由文件夹
2. 添加 `page.tsx` 文件
3. 使用 `auth()` 进行权限检查

### 添加 Server Action

1. 在页面文件中定义 `"use server"` 函数
2. 使用 Zod 验证输入
3. 使用 Prisma 操作数据库
4. 返回标准化响应

### 添加 UI 组件

使用 ShadCN UI：

```bash
npx shadcn-ui@latest add <component-name>
```

## 测试

### 边界测试场景

1. **Token 耗尽测试** - 组织 Token 用完时使用 AI 批改
2. **文件格式测试** - 上传非 CSV 文件进行批量导入
3. **封禁用户测试** - 封禁用户后尝试登录

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署即可

### 自托管部署

1. 构建生产版本

```bash
npm run build
```

2. 启动生产服务器

```bash
npm start
```

## 文档

- [需求规格说明书](./工程要求.md) - 完整的项目需求文档
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [ShadCN UI 文档](https://ui.shadcn.com)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
