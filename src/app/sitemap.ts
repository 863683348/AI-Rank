import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://toolsrank.lol';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/gpt6`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/dsh`, changeFrequency: 'daily', priority: 0.7 },
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
      .where(eq(listings.status, 'approved'))
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