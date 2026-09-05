export type Category = { slug: string; label: string; labelEn: string };

/** 榜单分类（slug 与 listings.category 字段对应，default 'ai-tools'） */
export const CATEGORIES: Category[] = [
  { slug: 'ai-tools', label: 'AI 工具', labelEn: 'AI Tools' },
  { slug: 'gpt6', label: 'GPT-6 专区', labelEn: 'GPT-6 Hub' },
  { slug: 'dsh', label: 'DSH 专区', labelEn: 'DSH Hub' },
  { slug: 'ai-agent', label: 'AI 智能体', labelEn: 'AI Agents' },
  { slug: 'image', label: '图像生成', labelEn: 'Image' },
  { slug: 'video', label: '视频生成', labelEn: 'Video' },
  { slug: 'audio', label: '音频 / 音乐', labelEn: 'Audio / Music' },
  { slug: 'writing', label: '写作助手', labelEn: 'Writing' },
  { slug: 'coding', label: '编程开发', labelEn: 'Coding' },
  { slug: 'productivity', label: '效率办公', labelEn: 'Productivity' },
  { slug: 'other', label: '其他', labelEn: 'Other' },
];

import type { Locale } from '@/lib/i18n/dict';

const LABEL_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function categoryLabel(slug: string | null | undefined, locale: Locale = 'zh'): string {
  if (!slug) return locale === 'en' ? 'Other' : '其他';
  const c = LABEL_MAP.get(slug);
  if (!c) return locale === 'en' ? 'Other' : '其他';
  return locale === 'en' ? c.labelEn : c.label;
}

export function isKnownCategory(slug: string): boolean {
  return LABEL_MAP.has(slug);
}