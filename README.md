# 壳儿 - 现代化影视播放平台

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

基于 Next.js 16 开发的现代化影视聚合平台，集成豆瓣评分、多视频源切换、智能匹配播放等功能

[在线演示](https://your-demo-url.vercel.app) · [问题反馈](https://github.com/yourusername/kerkerker/issues) · [功能建议](https://github.com/yourusername/kerkerker/issues)

</div>

## ✨ 核心特性

### 🎬 影视功能
- **豆瓣集成**: 实时获取豆瓣 Top250、热映榜单、最新电影等数据
- **智能匹配**: 自动匹配豆瓣影片与视频源，支持多源切换
- **高级搜索**: 支持片名、演员、导演等多维度搜索
- **分类筛选**: 按类型、地区、年份等条件筛选
- **播放历史**: 自动记录观看进度

### 🎯 技术亮点
- **数据库持久化**: SQLite 数据库存储配置，跨设备共享
- **后台管理**: 可视化管理视频源配置
- **多播放器**: 支持多个解析接口切换
- **响应式设计**: 完美适配桌面端和移动端
- **无限滚动**: 流畅的瀑布流加载体验
- **深色模式**: 护眼的夜间主题

## 🚀 快速开始

### 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/unilei/kerkerker)

点击上方按钮，一键部署到 Vercel（推荐）

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourusername/kerkerker.git
cd kerkerker

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 📝 配置说明

### 1. 配置视频源

部署完成后，访问后台管理页面配置视频源：

```
http://your-domain.com/admin/settings
```

**方式一：导入预设配置**
- 点击「导入预设配置」按钮
- 系统自动导入 9 个预配置的视频源

**方式二：手动添加**
```typescript
{
  key: 'source_key',       // 唯一标识
  name: '资源站名称',      // 显示名称
  api: 'https://api.example.com/api.php/provide/vod',  // API地址
  playUrl: 'https://player.example.com/?url=',         // 播放器地址
  type: 'json'             // 数据格式: json 或 xml
}
```

### 2. 数据库配置

应用使用 SQLite 数据库，数据文件位于 `data/app.db`

**数据库表结构**：
- `vod_sources`: 视频源配置
- `vod_source_selection`: 当前选中的视频源

## 🏗️ 项目结构

```
kerkerker/
├── app/                          # Next.js App Router
│   ├── api/                     # API 路由
│   │   ├── douban/             # 豆瓣相关 API
│   │   │   ├── hero/           # 首页轮播
│   │   │   ├── new/            # 最新电影
│   │   │   ├── 250/            # Top250
│   │   │   └── match-vod/      # 视频源匹配
│   │   ├── drama/              # 影视数据 API
│   │   ├── vod-sources/        # 视频源管理 API
│   │   └── image-proxy/        # 图片代理
│   ├── admin/                   # 后台管理
│   │   └── settings/           # 视频源配置
│   ├── play/[id]/              # 播放页面
│   ├── movies/                  # 电影列表
│   ├── latest/                  # 最新上映
│   └── page.tsx                # 首页
├── components/                  # React 组件
│   ├── DoubanCard.tsx          # 豆瓣电影卡片
│   └── DramaCard.tsx           # 视频卡片
├── lib/                         # 工具库
│   ├── db.ts                   # 数据库连接
│   ├── vod-sources-db.ts       # 视频源数据访问
│   └── preset-vod-sources.ts   # 预设配置
├── types/                       # TypeScript 类型
│   ├── douban.ts               # 豆瓣数据类型
│   └── drama.ts                # 影视数据类型
└── data/                        # 数据目录
    └── app.db                  # SQLite 数据库
```

## 🔌 API 接口

### 豆瓣数据
- `GET /api/douban/hero` - 获取首页轮播数据
- `GET /api/douban/new` - 获取最新电影
- `GET /api/douban/250` - 获取 Top250
- `POST /api/douban/match-vod` - 匹配视频源

### 视频源管理
- `GET /api/vod-sources` - 获取视频源列表
- `POST /api/vod-sources` - 保存视频源配置
- `PUT /api/vod-sources` - 更新选中的视频源

### 影视数据
- `POST /api/drama/list` - 获取影视列表
- `POST /api/drama/detail` - 获取影视详情
- `POST /api/drama/categories` - 获取分类列表

## 🛠️ 技术栈

| 技术 | 说明 | 版本 |
|------|------|------|
| [Next.js](https://nextjs.org/) | React 框架 | 16.0 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 | 5.0 |
| [Tailwind CSS](https://tailwindcss.com/) | CSS 框架 | 4.0 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite 数据库 | Latest |
| [React Hooks](https://react.dev/reference/react) | 状态管理 | - |

## 📦 部署指南

### Vercel（推荐）

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 部署完成后访问 `/admin/settings` 配置视频源

**注意**: Vercel Serverless 环境需要注意：
- SQLite 数据库文件会在每次部署后重置
- 生产环境建议使用 PostgreSQL 或 MySQL

⚠️ 重要提示
在 Vercel serverless 环境中使用 SQLite 有以下限制：

数据不持久化：/tmp 目录的内容在函数调用之间不保留
数据隔离：每个 serverless 函数实例有独立的文件系统
性能问题：冷启动时需要重新初始化数据库
建议：对于生产环境，考虑迁移到云数据库：

Vercel Postgres
PlanetScale (MySQL)
Supabase (PostgreSQL)
MongoDB Atlas
当前修改可以让应用在 Vercel 上运行，但数据会在每次部署或函数实例重启时丢失。

### 自托管

```bash
# 构建
npm run build

# 使用 PM2 运行
pm2 start npm --name "kerkerker" -- start

# 或使用 forever
forever start -c "npm start" ./
```

## ⚙️ 环境变量

创建 `.env` 文件：

```bash
# 可选：自定义数据库路径
DATABASE_PATH=./data/app.db

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源

## 💡 常见问题

<details>
<summary><b>Q: 切换浏览器后配置丢失？</b></summary>

A: 配置已存储在服务端 SQLite 数据库中，所有浏览器共享同一配置。如果仍然丢失，请检查数据库文件是否被正确持久化。
</details>

<details>
<summary><b>Q: 找不到播放源？</b></summary>

A: 
1. 确保在 `/admin/settings` 中配置了视频源
2. 检查视频源 API 是否可访问
3. 尝试切换到其他视频源
</details>

<details>
<summary><b>Q: 豆瓣数据加载失败？</b></summary>

A: 部分地区可能无法访问豆瓣 API，可以配置代理或使用备用数据源。
</details>

## 🙏 致谢

- 豆瓣数据: [豆瓣电影](https://movie.douban.com/)
- UI 组件: [Tailwind CSS](https://tailwindcss.com/)
- 开发框架: [Next.js](https://nextjs.org/)

---

<div align="center">

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！

Made with ❤️ by [Your Name](https://github.com/unilei)

</div>
