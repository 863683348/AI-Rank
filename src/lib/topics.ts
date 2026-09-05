/** 专题区配置：每个 slug 对应一个独立落地页 /topic/{slug}，分类筛选共用 listings.category */
export type Topic = {
  slug: string;
  chipLabel: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  cta: string;
};

export const TOPICS: Topic[] = [
  {
    slug: 'gpt6',
    chipLabel: 'GPT-6 专区',
    h1: 'GPT-6 工具榜 —— 上 C 位当显眼包',
    metaTitle: 'GPT-6 工具榜 | 基于 GPT-6 Astra 的 AI 工具竞价排行榜',
    metaDescription:
      'GPT-6 Astra 已发布：$10/M 输入、$50/M 输出。收录基于 GPT-6 的工具与智能体，金额即排名、公开可审计、每日 00:00 重置。你的 GPT-6 工具，¥1 起竞价上 C 位。',
    intro: [
      'GPT-6 Astra 于 2026 年 9 月 3 日发布，OpenAI 定位为最强端到端工作模型：电脑自主操作、105 万上下文、API 定价 $10/M 输入 + $50/M 输出。',
      'API 全面开放后，围绕 GPT-6 的新工具会集中上线。本专区收录它们：金额即排名，每一笔公开可审计，每日 00:00（北京时间）在榜金额重置为 ¥1。',
      '首批为编辑收录条目（象征性 ¥2 在榜），任何一次真实竞价即可超越它们。',
    ],
    cta: '做了 GPT-6 工具？¥1 上 C 位当显眼包',
  },
  {
    slug: 'dsh',
    chipLabel: 'DSH 专区',
    h1: 'DeepSeek Harness（DSH）生态榜',
    metaTitle: 'DeepSeek Harness 生态榜 | DSH 工具与工作流竞价排行',
    metaDescription:
      'DeepSeek Harness（dsh）与 DeepSeek 生态工具专区：CLI/Agent Harness、工作流、周边工具。金额即排名，公开可审计，每日 00:00 重置，¥1 起竞价上 C 位。',
    intro: [
      'DeepSeek 是高性价比模型的代表，DSH（DeepSeek Harness）让 dsh CLI + Web UI 成为日常 Agent 开发基建。',
      '本专区收录 DeepSeek 生态的工具、工作流与周边：金额即排名，每一笔公开可审计，每日 00:00（北京时间）在榜金额重置为 ¥1。',
      '首批为编辑收录条目（象征性 ¥2 在榜），任何一次真实竞价即可超越它们。',
    ],
    cta: '做了 DeepSeek 生态工具？¥1 上 C 位',
  },
];

const MAP = new Map(TOPICS.map((t) => [t.slug, t]));

export function getTopic(slug: string): Topic | undefined {
  return MAP.get(slug);
}

export const TOPIC_SLUGS = new Set(TOPICS.map((t) => t.slug));
