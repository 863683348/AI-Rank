/**
 * 演示数据灌库脚本（sql.query 参数化批量插入 + 抗瞬时失败）
 * - 每表一条（clicks 分批）多值 INSERT，参数化防注入，且能真正落库。
 * - 全程对 Neon 偶发 fetch failed 做指数退避重试。
 * - 运行：DATABASE_URL=... node scripts/seed.mjs
 */
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

async function rq(fn) {
  let lastErr;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < 9) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** 构造 INSERT：cols 列名数组，rows 为参数数组的数组（每项为一条记录的值） */
function buildInsert(table, cols, rows) {
  const colList = cols.join(', ');
  const tuples = [];
  const params = [];
  let pi = 1;
  for (const row of rows) {
    const phs = row.map(() => `$${pi++}`).join(', ');
    tuples.push(`( ${phs} )`);
    params.push(...row);
  }
  return { stmt: `INSERT INTO ${table} (${colList}) VALUES ${tuples.join(', ')}`, params };
}

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const BJ = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

// name, url, description, category, clicks, bids:[{a:金额, d:几天前}]
const TOOLS = [
  ['ChatGPT', 'https://chatgpt.com', 'OpenAI 对话式 AI 助手', 'ai-tools', 412, [
    { a: 12, d: 30 }, { a: 40, d: 14 }, { a: 88, d: 2 },
  ]],
  ['Perplexity', 'https://www.perplexity.ai', 'AI 答案引擎 / 搜索', 'ai-tools', 230, [
    { a: 18, d: 20 }, { a: 45, d: 1 },
  ]],

  ['AutoGPT', 'https://www.autogpt.net', '自主任务智能体', 'ai-agent', 180, [
    { a: 30, d: 25 }, { a: 66, d: 3 },
  ]],
  ['Dify', 'https://dify.ai', '开源 LLM 应用开发平台', 'ai-agent', 320, [
    { a: 52, d: 0 },
  ]],

  ['Midjourney', 'https://www.midjourney.com', 'AI 图像生成', 'image', 890, [
    { a: 60, d: 40 }, { a: 120, d: 5 },
  ]],
  ['Stable Diffusion', 'https://stability.ai', '开源图像扩散模型', 'image', 210, [
    { a: 38, d: 8 },
  ]],

  ['Runway', 'https://runwayml.com', 'AI 视频生成与编辑', 'video', 360, [
    { a: 50, d: 22 }, { a: 95, d: 0 },
  ]],
  ['Pika', 'https://pika.art', 'AI 短视频生成', 'video', 280, [
    { a: 58, d: 4 },
  ]],

  ['Suno', 'https://suno.com', 'AI 音乐创作', 'audio', 410, [
    { a: 30, d: 18 }, { a: 76, d: 2 },
  ]],
  ['ElevenLabs', 'https://elevenlabs.io', 'AI 语音合成', 'audio', 300, [
    { a: 64, d: 6 },
  ]],

  ['Notion AI', 'https://www.notion.so', '文档与写作助手', 'writing', 250, [
    { a: 42, d: 9 },
  ]],
  ['文心一言', 'https://yiyan.baidu.com', '百度对话写作助手', 'writing', 150, [
    { a: 28, d: 12 },
  ]],

  ['GitHub Copilot', 'https://github.com/features/copilot', 'AI 编程助手', 'coding', 720, [
    { a: 70, d: 35 }, { a: 110, d: 1 },
  ]],
  ['Cursor', 'https://cursor.com', 'AI 代码编辑器', 'coding', 650, [
    { a: 98, d: 3 },
  ]],

  ['飞书', 'https://www.feishu.cn', '企业协作办公套件', 'productivity', 200, [
    { a: 36, d: 15 },
  ]],
  ['Todoist AI', 'https://todoist.com', '智能任务管理', 'productivity', 110, [
    { a: 22, d: 7 },
  ]],

  ['Character.AI', 'https://character.ai', '角色扮演对话 AI', 'other', 520, [
    { a: 70, d: 10 },
  ]],
  ['Hugging Face', 'https://huggingface.co', 'AI 模型社区', 'other', 340, [
    { a: 54, d: 5 },
  ]],
];

const L = TOOLS.map(([name, url, description, category, clicks, bidDefs]) => {
  const id = randomUUID();
  const lifetime = bidDefs.reduce((s, b) => s + b.a, 0);
  const last = bidDefs[bidDefs.length - 1];
  return { id, name, url, description, category, clicks, bidDefs, lifetime, last };
});

// listings
const listingRows = L.map((r) => [
  r.id, r.url, r.name, r.description, r.category,
  `${r.last.a}.00`, `${r.lifetime}.00`, iso(r.last.d), r.clicks, r.bidDefs.length,
]);
const { stmt: listingStmt, params: listingParams } = buildInsert(
  'listings',
  ['id', 'url', 'name', 'description', 'category', 'bid_amount', 'lifetime_amount', 'last_bid_at', 'total_clicks', 'board_version'],
  listingRows
);

// bids + payments
const bidRows = [];
const payRows = [];
for (const r of L) {
  for (const b of r.bidDefs) {
    const bidId = randomUUID();
    bidRows.push([bidId, r.id, `${b.a}.00`, 'yungouos', 'confirmed', iso(b.d)]);
    payRows.push([
      randomUUID(), bidId, r.id, `${b.a}.00`, 'CNY', 'yungouos',
      `seed-${bidId.slice(0, 8)}`, 'confirmed', iso(b.d),
    ]);
  }
}
const { stmt: bidStmt, params: bidParams } = buildInsert(
  'bids',
  ['id', 'listing_id', 'amount', 'payment_method', 'status', 'created_at'],
  bidRows
);
const { stmt: payStmt, params: payParams } = buildInsert(
  'payments',
  ['id', 'bid_id', 'listing_id', 'amount', 'currency', 'payment_method', 'external_id', 'status', 'confirmed_at'],
  payRows
);

// clicks（分批，避免单条 SQL 过大）
const clickRows = [];
L.forEach((r, i) => {
  const n = Math.min(r.clicks, 20);
  for (let k = 0; k < n; k++) clickRows.push([r.id, `seed-${i}-${k}`, BJ]);
});

console.log(`准备：listings=${L.length}, bids=${bidRows.length}, payments=${payRows.length}, clicks=${clickRows.length}`);

await rq(() => sql.query(listingStmt, listingParams));
console.log('✓ listings');
await rq(() => sql.query(bidStmt, bidParams));
console.log('✓ bids');
await rq(() => sql.query(payStmt, payParams));
console.log('✓ payments');

const CHUNK = 50;
for (let i = 0; i < clickRows.length; i += CHUNK) {
  const slice = clickRows.slice(i, i + CHUNK);
  const { stmt, params } = buildInsert('clicks', ['listing_id', 'ip_hash', 'day'], slice);
  await rq(() => sql.query(stmt, params));
}
console.log('✓ clicks');

console.log('\n演示数据灌库完成。');
