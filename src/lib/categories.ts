export type Category = { slug: string; label: string };

/** 榜单分类（slug 与 listings.category 字段对应，default 'ai-tools'） */
export const CATEGORIES: Category[] = [
  { slug: 'ai-tools', label: 'AI 工具' },
  { slug: 'ai-agent', label: 'AI 智能体' },
  { slug: 'image', label: '图像生成' },
  { slug: 'video', label: '视频生成' },
  { slug: 'audio', label: '音频 / 音乐' },
  { slug: 'writing', label: '写作助手' },
  { slug: 'coding', label: '编程开发' },
  { slug: 'productivity', label: '效率办公' },
  { slug: 'other', label: '其他' },
];

const LABEL_MAP = new Map(CATEGORIES.map((c) => [c.slug, c.label]));

export function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return '其他';
  return LABEL_MAP.get(slug) ?? '其他';
}

export function isKnownCategory(slug: string): boolean {
  return LABEL_MAP.has(slug);
}
