# IntelliTeach 系统架构设计文档

## 1. 系统架构概述

IntelliTeach 采用现代化的全栈架构，基于 Next.js 14 App Router 构建，实现了完整的前后端一体化解决方案。

### 1.1 技术架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端层 (Client)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React Components (ShadCN UI + Tailwind CSS)        │    │
│  │  - Landing Page  - Login/Register  - Dashboards    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js App Router 层                       │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │  Page Routes     │  │  API Routes & Server Actions │    │
│  │  - /admin        │  │  - Auth API                  │    │
│  │  - /teacher      │  │  - CRUD Actions              │    │
│  │  - /student      │  │  - AI Integration            │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     业务逻辑层 (BLL)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth        │  │  Validation  │  │  AI Service  │     │
│  │  NextAuth.js │  │  Zod Schemas │  │  智谱AI GLM  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  数据访问层 (DAL)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Prisma ORM Client                      │   │
│  │  - Query Builder  - Migration  - Type Safety        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据库层 (Database)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  - Organizations  - Users  - Courses                │   │
│  │  - Assignments    - Submissions  - Enrollments      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. 核心模块设计

### 2.1 认证与授权模块 (Auth Module)

**技术选型**: NextAuth.js v5

**核心功能**:
- JWT Token 生成与验证
- Credentials Provider (邮箱+密码)
- Session 管理
- 角色权限控制 (RBAC)

**数据流**:
```
用户登录 → Credentials Provider → 密码验证 (bcrypt)
         → JWT Token 生成 → Session 创建 → Cookie 存储
```

**中间件保护**:
```typescript
// middleware.ts
export { auth as middleware } from "@/auth"
```

### 2.2 多租户隔离模块 (Multi-tenancy)

**隔离策略**: 基于 organizationId 的行级隔离

**实现原则**:
1. 每个查询必须包含 organizationId 过滤
2. Session 中存储用户的 organizationId
3. Server Actions 中强制校验组织归属

**示例代码**:
```typescript
// 教师只能访问自己组织的课程
const courses = await prisma.course.findMany({
  where: {
    teacherId: session.userId,
    organizationId: session.organizationId // 多租户隔离
  }
})
```

### 2.3 AI 批改模块 (AI Grading)

**技术选型**: 智谱AI GLM-4-Flash (glm-4-flash)

**核心流程**:
```
1. 订阅守卫 (Subscription Guard)
   - 检查组织 AI 订阅状态
   - 验证 Token 余额
   
2. Prompt 构建
   - 作业要求
   - 学生提交内容
   - JSON Schema 定义
   
3. API 调用
   - 智谱AI GLM API
   - JSON Mode 响应
   
4. 结果解析与存储
   - 评分 (score)
   - 优点 (strengths)
   - 不足 (weaknesses)
   - 综合反馈 (feedback)
   
5. Token 计数
   - 更新组织 Token 使用量
```

### 2.4 数据验证模块 (Validation)

**技术选型**: Zod

**验证层级**:
1. **前端验证**: React Hook Form + Zod
2. **Server Action 验证**: Zod Schema
3. **数据库约束**: Prisma Schema

**示例**:
```typescript
const CreateCourseSchema = z.object({
  name: z.string().min(2, "课程名称至少2个字"),
  code: z.string().min(2, "课程代码至少2个字"),
  description: z.string().optional(),
})
```

## 3. 数据库设计

### 3.1 E-R 图概述

```
Organization (组织)
    │
    ├──< Users (用户)
    │      │
    │      ├──< Courses (教师创建) [TeacherCourses]
    │      ├──< Enrollments (学生选课)
    │      └──< Submissions (学生提交)
    │
    └──< Courses (组织课程)
           │
           ├──< Assignments (作业)
           │       │
           │       └──< Submissions (提交)
           │
           └──< Enrollments (选课关系)
```

### 3.2 核心关系

1. **Organization ↔ User**: 一对多 (一个组织有多个用户)
2. **Organization ↔ Course**: 一对多 (一个组织有多个课程)
3. **User ↔ Course**: 一对多 [教师] (一个教师创建多个课程)
4. **User ↔ Enrollment**: 一对多 [学生] (一个学生选多门课)
5. **Course ↔ Enrollment**: 一对多 (一门课有多个学生)
6. **Course ↔ Assignment**: 一对多 (一门课有多个作业)
7. **Assignment ↔ Submission**: 一对多 (一个作业有多个提交)
8. **User ↔ Submission**: 一对多 [学生] (一个学生有多个提交)

## 4. 安全性设计

### 4.1 认证安全

- ✅ 密码使用 bcrypt 加密 (Salt Rounds: 10)
- ✅ JWT Token 有效期控制
- ✅ HTTPS 强制加密传输
- ✅ CSRF 保护 (NextAuth 内置)

### 4.2 授权安全

- ✅ 基于角色的访问控制 (RBAC)
- ✅ 中间件路由保护
- ✅ Server Action 权限验证
- ✅ 数据库行级安全 (organizationId 过滤)

### 4.3 输入验证

- ✅ Zod 全链路校验
- ✅ SQL 注入防护 (Prisma ORM)
- ✅ XSS 防护 (React 自动转义)

## 5. 性能优化

### 5.1 前端优化

- **代码分割**: Next.js 自动 Code Splitting
- **懒加载**: Dynamic Imports
- **静态生成**: 公共页面使用 SSG
- **图片优化**: Next.js Image 组件

### 5.2 后端优化

- **数据库索引**: 
  - User.email (unique index)
  - Organization.name (unique index)
  - Course.teacherId + organizationId (composite index)
  
- **查询优化**:
  - Prisma include/select 精确查询
  - 分页加载
  
- **缓存策略**:
  - Next.js 页面缓存
  - revalidatePath 按需重新验证

## 6. 扩展性设计

### 6.1 水平扩展

- **无状态设计**: Server Actions 无状态
- **Session 外置**: 可配置 Redis Session Store
- **数据库读写分离**: Prisma 支持 Read Replicas

### 6.2 功能扩展

- **插件化设计**: AI Provider 可替换
- **多语言支持**: i18n 预留接口
- **第三方集成**: OAuth Provider 扩展

## 7. 部署架构

### 7.1 Vercel 部署 (推荐)

```
GitHub Repo → Vercel Auto Deploy
                │
                ├─→ Edge Functions (Middleware)
                ├─→ Serverless Functions (API Routes)
                └─→ CDN (Static Assets)
                
Vercel Postgres ← Prisma Client
```

### 7.2 自托管部署

```
Docker Container
    │
    ├─→ Next.js Server (Node.js)
    ├─→ PostgreSQL Database
    └─→ Nginx Reverse Proxy
```

## 8. 监控与日志

### 8.1 应用监控

- **错误追踪**: Error Boundaries
- **性能监控**: Next.js Analytics
- **API 监控**: Server Actions 响应时间

### 8.2 日志系统

- **访问日志**: Next.js Request Logs
- **业务日志**: Console.log (生产环境可接入 Sentry)
- **审计日志**: 关键操作记录 (预留字段)

## 9. 技术债务与改进方向

### 9.1 当前限制

- [ ] 文件上传暂未实现 (预留字段)
- [ ] 邮件通知系统未集成
- [ ] 实时通知 (WebSocket) 未实现

### 9.2 未来优化

- [ ] 引入 Redis 缓存
- [ ] 实现消息队列 (批改任务异步化)
- [ ] 数据分析与报表系统
- [ ] 移动端 APP (React Native)
