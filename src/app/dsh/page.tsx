import type { Metadata } from 'next';
import TopicPage from '@/components/TopicPage';
import { getTopic } from '@/lib/topics';

const slug = 'dsh';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = getTopic(slug);
  return {
    title: t?.metaTitle ?? 'DSH 生态榜',
    description: t?.metaDescription,
  };
}

export default function Page() {
  return <TopicPage slug={slug} />;
}
