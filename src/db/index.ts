import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle>;

/**
 * Neon HTTP driver + 懒加载单例。
 * 坑 1：每次冷启动新建连接会耗尽 Neon 连接数 —— 用 globalThis 缓存。
 * 坑 2：build 阶段收集页面数据时没有 DATABASE_URL —— 顶层不能直接 neon()，
 *       用 Proxy 把初始化推迟到第一次真正查询。
 */
const globalForDb = globalThis as unknown as { __aiRankDb?: Db };

function createDb(): Db {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

function getDb(): Db {
  if (!globalForDb.__aiRankDb) {
    globalForDb.__aiRankDb = createDb();
  }
  return globalForDb.__aiRankDb;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
