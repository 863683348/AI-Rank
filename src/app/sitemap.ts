import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://toolsrank.lol';

// 榜单是「每天 00:00 重置、随时新增 listing」的数据，必须定期重建，
// 否则 sitemap 会一直是构建那一刻的静态快照（历史实测被缓存 4.6 天），新条目永远进不来。
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/gpt6`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/dsh`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/stats`, changeFrequency: 'hourly', priority: 0.6 },
    { url: `${SITE_URL}/rules`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/categories`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const rows = await db
      .select({
        id: listings.id,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .where(and(eq(listings.status, 'approved'), eq(listings.paid, true)))
      .limit(1000);

    const listingPages: MetadataRoute.Sitemap = rows.map((r) => ({
      url: `${SITE_URL}/listing/${r.id}`,
      lastModified: r.updatedAt,
      changeFrequency: 'hourly',
      priority: 0.8,
    }));

    return [...staticPages, ...listingPages];
  } catch {
    // 数据库查询失败（CI 等环境），返回静态页
    return staticPages;
  }
}