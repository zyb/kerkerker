#!/bin/bash
set -e

# 设置默认环境变量（如果未设置）
export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/kerkerker}
export REDIS_URL=${REDIS_URL:-redis://localhost:6379}
export MONGODB_DB_NAME=${MONGODB_DB_NAME:-kerkerker}
export NODE_ENV=${NODE_ENV:-production}

# 创建必要的目录
mkdir -p /var/lib/redis
mkdir -p /var/lib/mongodb
mkdir -p /data/db
mkdir -p /data/configdb
mkdir -p /var/log/supervisor

# 设置权限
chown -R redis:redis /var/lib/redis 2>/dev/null || true
chown -R mongodb:mongodb /data/db /data/configdb 2>/dev/null || true

# 初始化 MongoDB（如果需要）
if [ ! -f /data/db/.mongodb_initialized ]; then
    echo "初始化 MongoDB..."
    # MongoDB 会在首次启动时自动初始化
    touch /data/db/.mongodb_initialized
fi

# 执行传入的命令
exec "$@"

