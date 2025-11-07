import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 确保 data 目录存在
// 在 Vercel 等 serverless 环境中使用 /tmp 目录，因为其他目录是只读的
const isVercel = process.env.VERCEL === '1';
const dataDir = isVercel ? '/tmp' : path.join(process.cwd(), 'data');

if (!isVercel && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dataDir, 'app.db');

// 创建或连接数据库
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    initializeDatabase(db);
  }
  return db;
}

// 初始化数据库表
function initializeDatabase(db: Database.Database) {
  // 创建视频源配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS vod_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      api TEXT NOT NULL,
      play_url TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'json',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_vod_sources_enabled ON vod_sources(enabled);
    CREATE INDEX IF NOT EXISTS idx_vod_sources_sort ON vod_sources(sort_order);
  `);

  // 创建选中的视频源配置表（单条记录）
  db.exec(`
    CREATE TABLE IF NOT EXISTS vod_source_selection (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      selected_key TEXT,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);

  console.log('✅ 数据库初始化完成');
}

// 关闭数据库连接
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
