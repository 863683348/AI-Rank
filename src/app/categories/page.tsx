import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc } from 'drizzle-orm';
import type { Metadata } from 'next';
import { CATEGORIES } from '@/lib/categories';
import CategoriesView, { type CategoryGroup } from '@/components/CategoriesView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '分类榜单',
  description: 'ToolsRank 按 AI 工具类型分桶的子榜单：图像、文本、代码、语音、视频。',
  alternates: { canonical: '/categories' },
};

type Row = {
  id: string;
  name: string;
  url: string;
  iconUrl: string | null;
  category: string;
  bidAmount: string;
  lifetimeAmount: string;
  totalClicks: number;
};

export default async function CategoriesPage() {
  const all: Row[] = await db
    .select({
      id: listings.id,
      name: listings.name,
      url: listings.url,
      iconUrl: listings.iconUrl,
      category: listings.category,
      bidAmount: listings.bidAmount,
      lifetimeAmount: listings.lifetimeAmount,
      totalClicks: listings.totalClicks,
    })
    .from(listings)
    .orderBy(desc(listings.bidAmount));

  const groups: Record<string, Row[]> = {};
  for (const l of all) (groups[l.category] ??= []).push(l);

  const ordered: CategoryGroup[] = CATEGORIES.map((c) => ({
    ...c,
    items: groups[c.slug] ?? [],
  }));

  return <CategoriesView groups={ordered} />;
}