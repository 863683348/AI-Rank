/**
 * 专题区种子数据：编辑收录条目，象征性 ¥2 在榜，任何真实竞价可超越。
 * 运行：node --env-file=.env scripts/seed-topics.mjs
 * 幂等：url 唯一索引 ON CONFLICT DO NOTHING
 */
import { neon } from '@neondatabase/serverless';

const seeds = [
  // GPT-6 专区（信息来源：OpenAI 发布会 + 2026-09-04 Product Hunt 热榜）
  { url: 'https://openai.com/', name: 'GPT-6 Astra（OpenAI 官方）', description: '最强端到端工作模型：电脑自主操作、105 万上下文，API $10/M 入 + $50/M 出', category: 'gpt6' },
  { url: 'https://openrouter.ai/', name: 'GPT-6 Astra on OpenRouter', description: '统一 API 网关调用 GPT-6 Astra / Astra Pro，含 105 万上下文档位说明', category: 'gpt6' },
  { url: 'https://www.producthunt.com/products/myaicademy', name: 'myAIcademy', description: 'GPT-6 发布日 Product Hunt 热榜 #2：按角色和工具定制 AI 技能培训，课程随工具更新', category: 'gpt6' },
  { url: 'https://www.producthunt.com/products/twelvelabs', name: 'Compliance by TwelveLabs', description: '视频合规审查：Pegasus 模型给带上下文的解释，规则由合规团队自持', category: 'gpt6' },
  // DSH 专区（dsh 本体待用户提供公开 URL 后补录）
  { url: 'https://www.deepseek.com/', name: 'DeepSeek 官网', description: '高性价比模型代表，DeepSeek 生态的起点', category: 'dsh' },
  { url: 'https://api-docs.deepseek.com/', name: 'DeepSeek API 文档', description: 'DeepSeek API 接入文档，DSH 工作流的上游', category: 'dsh' },
];

const sql = neon(process.env.DATABASE_URL);

let inserted = 0;
for (const s of seeds) {
  const rows = await sql`
    INSERT INTO listings (url, name, description, category, bid_amount, lifetime_amount, status, verified)
    VALUES (${s.url}, ${s.name}, ${s.description}, ${s.category}, '2.00', '2.00', 'approved', true)
    ON CONFLICT (url) DO NOTHING
    RETURNING id
  `;
  inserted += rows.length;
  console.log(`${rows.length ? 'seeded' : 'skip  '} [${s.category}] ${s.name}`);
}
console.log(`done: ${inserted} inserted, ${seeds.length - inserted} already existed`);
