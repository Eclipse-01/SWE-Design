# IntelliTeach 部署指南

## 1. 环境准备

### 1.1 系统要求

- **Node.js**: 18.x 或更高版本
- **PostgreSQL**: 14.x 或更高版本
- **npm**: 9.x 或更高版本

### 1.2 所需服务

- **数据库**: PostgreSQL 实例
- **API 密钥**: 智谱AI API Key

## 2. 本地开发部署

### 2.1 克隆项目

```bash
git clone <repository-url>
cd SWE-Design
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/intelliteach"

# NextAuth 配置
NEXTAUTH_SECRET="your-random-secret-key-here"  # 使用 openssl rand -base64 32 生成
NEXTAUTH_URL="http://localhost:3000"

# 智谱AI API
GEMINI_API_KEY="your-zhipu-api-key"  # 从 https://open.bigmodel.cn/ 获取
```

### 2.4 初始化数据库

```bash
# 运行数据库迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# (可选) 使用 Prisma Studio 查看数据库
npx prisma studio
```

### 2.5 创建初始管理员账户

```bash
# 进入 Prisma Studio 或使用 SQL 直接创建
INSERT INTO "Organization" (
  "idString", "name", "aiSubStatus", "aiTokenLimit"
) VALUES (
  gen_random_uuid(), '系统组织', 'ACTIVE', 1000000
);

# 获取组织 ID 后创建管理员
INSERT INTO "User" (
  id, name, email, "passwordHash", role, "organizationId"
) VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@example.com',
  '$2a$10$...', -- bcrypt hash of 'admin123'
  'SUPER_ADMIN',
  '<organization-id>'
);
```

或使用 Node.js 脚本：

```javascript
// scripts/create-admin.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: '系统组织',
      aiSubStatus: 'ACTIVE',
      aiTokenLimit: 1000000,
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: org.idString,
    },
  });

  console.log('Admin user created!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

运行：

```bash
node scripts/create-admin.js
```

### 2.6 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 3. Vercel 部署 (推荐)

### 3.1 准备工作

1. 创建 Vercel 账号: https://vercel.com
2. 准备 PostgreSQL 数据库 (推荐 Vercel Postgres 或 Supabase)

### 3.2 部署步骤

#### 方式一：通过 Vercel Dashboard

1. 登录 Vercel Dashboard
2. 点击 "Add New" → "Project"
3. 导入 GitHub 仓库
4. 配置环境变量：

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
GEMINI_API_KEY=...
```

5. 点击 "Deploy"

#### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 设置环境变量
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GEMINI_API_KEY

# 部署到生产环境
vercel --prod
```

### 3.3 数据库迁移

部署后需要运行数据库迁移：

```bash
# 方式一：本地运行 (需要生产数据库访问权限)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 方式二：通过 Vercel CLI
vercel env pull .env.production
DATABASE_URL="$(cat .env.production | grep DATABASE_URL | cut -d '=' -f2)" npx prisma migrate deploy
```

### 3.4 创建管理员账户

使用上述本地部署的脚本方法，或通过 Prisma Studio 连接生产数据库创建。

## 4. Docker 部署

### 4.1 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

### 4.2 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: intelliteach
      POSTGRES_PASSWORD: password
      POSTGRES_DB: intelliteach
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://intelliteach:password@db:5432/intelliteach
      NEXTAUTH_SECRET: your-secret-here
      NEXTAUTH_URL: http://localhost:3000
      GEMINI_API_KEY: your-api-key
    depends_on:
      - db

volumes:
  postgres_data:
```

### 4.3 构建和运行

```bash
# 构建镜像
docker-compose build

# 运行容器
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 查看日志
docker-compose logs -f app
```

## 5. 自托管部署 (Linux)

### 5.1 系统准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2 (进程管理器)
sudo npm install -g pm2
```

### 5.2 配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE intelliteach;
CREATE USER intelliteach WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE intelliteach TO intelliteach;
\q
```

### 5.3 部署应用

```bash
# 克隆代码
cd /var/www
git clone <repository-url> intelliteach
cd intelliteach

# 安装依赖
npm install

# 配置环境变量
nano .env

# 运行迁移
npx prisma migrate deploy

# 构建应用
npm run build

# 使用 PM2 启动
pm2 start npm --name "intelliteach" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 5.4 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/intelliteach
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/intelliteach /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.5 配置 SSL (使用 Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 6. 生产环境检查清单

部署到生产环境前，请确保：

- [ ] 使用强密码的 PostgreSQL 数据库
- [ ] 生成安全的 NEXTAUTH_SECRET (至少 32 字符)
- [ ] 配置正确的 NEXTAUTH_URL (生产域名)
- [ ] 有效的智谱AI API Key
- [ ] 数据库定期备份
- [ ] 配置 HTTPS/SSL
- [ ] 设置防火墙规则
- [ ] 配置日志监控
- [ ] 测试所有核心功能
- [ ] 创建管理员账户

## 7. 维护与更新

### 7.1 更新代码

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 运行新的迁移
npx prisma migrate deploy

# 重新构建
npm run build

# 重启应用
pm2 restart intelliteach
```

### 7.2 数据库备份

```bash
# 备份数据库
pg_dump -U intelliteach intelliteach > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U intelliteach intelliteach < backup_20240101.sql
```

### 7.3 查看应用日志

```bash
# PM2 日志
pm2 logs intelliteach

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 8. 故障排查

### 8.1 常见问题

#### 数据库连接失败

```
Error: P1001: Can't reach database server
```

**解决方案**:
- 检查 DATABASE_URL 是否正确
- 确认数据库服务是否运行
- 检查防火墙规则

#### 构建失败

```
Error: Cannot find module '@prisma/client'
```

**解决方案**:
```bash
npx prisma generate
npm run build
```

#### 认证不工作

```
[next-auth][error][JWT_SESSION_ERROR]
```

**解决方案**:
- 确认 NEXTAUTH_SECRET 已设置
- 检查 NEXTAUTH_URL 是否正确
- 清除浏览器 Cookie

## 9. 性能优化建议

### 9.1 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_course_org ON "Course"("organizationId");
CREATE INDEX idx_course_teacher ON "Course"("teacherId");
```

### 9.2 缓存配置

- 启用 Next.js ISR (Incremental Static Regeneration)
- 配置 CDN (Cloudflare, Vercel Edge Network)
- 使用 Redis 缓存会话 (可选)

### 9.3 监控工具

- **应用监控**: Sentry, LogRocket
- **性能监控**: Vercel Analytics, Google Analytics
- **服务器监控**: Prometheus, Grafana

## 10. 安全加固

### 10.1 环境变量保护

- 不要将 `.env` 提交到 Git
- 使用环境变量管理工具 (Vercel, Railway)
- 定期轮换 API 密钥

### 10.2 数据库安全

- 使用强密码
- 限制数据库访问 IP
- 启用 SSL 连接
- 定期备份

### 10.3 应用安全

- 保持依赖更新 (`npm audit fix`)
- 配置 CORS
- 使用 Helmet.js (CSP headers)
- 限制请求速率 (Rate limiting)

## 支持

如有问题，请：
- 查看文档: README.md, ARCHITECTURE.md
- 提交 Issue: GitHub Issues
- 联系维护者

---

**祝部署顺利！** 🚀
