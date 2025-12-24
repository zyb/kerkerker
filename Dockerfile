# 多阶段构建 - 生产环境 Dockerfile

# ==================== 阶段 1: 依赖安装 ====================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括 devDependencies，构建时需要）
RUN npm ci && \
    npm cache clean --force

# ==================== 阶段 2: 构建应用 ====================
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量（构建时需要）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN npm run build

# ==================== 阶段 3: 运行应用 ====================
# 使用 MongoDB 官方镜像作为基础，然后安装 Node.js
FROM mongo:7 AS mongo-base

# 安装 Node.js 20、Redis 和 supervisor
RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y \
    nodejs \
    redis-server \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

FROM mongo-base AS runner
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# 创建必要的目录和用户
RUN mkdir -p /var/lib/redis \
    && mkdir -p /var/log/supervisor \
    && mkdir -p /data/db \
    && mkdir -p /data/configdb \
    && (groupadd -r redis 2>/dev/null || true) \
    && (useradd -r -g redis -u 999 redis 2>/dev/null || true) \
    && groupadd -r --gid 1001 nodejs \
    && useradd -r --uid 1001 --gid nodejs nextjs

# 复制必要文件
# Next.js standalone 模式的文件结构
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 查找并确保 server.js 在正确位置
# Next.js standalone 模式下，server.js 可能在根目录或 app 子目录
RUN if [ -f ./app/server.js ] && [ ! -f ./server.js ]; then \
        cp ./app/server.js ./server.js; \
    fi && \
    if [ ! -f ./server.js ]; then \
        find . -name "server.js" -type f | head -1 | xargs -I {} cp {} ./server.js || true; \
    fi

# 复制启动脚本和 supervisor 配置
COPY docker-entrypoint.sh /usr/local/bin/
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 设置权限
RUN chown -R nextjs:nodejs /app && \
    chown -R redis:redis /var/lib/redis 2>/dev/null || true && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# 暴露端口（只暴露主服务端口）
EXPOSE 3000

# 设置健康检查（禁用代理）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD NO_PROXY=localhost node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用启动脚本
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
