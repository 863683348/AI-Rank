import type { Metadata } from 'next';
import TopicPage from '@/components/TopicPage';
import { getTopic } from '@/lib/topics';

const slug = 'gpt6';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = getTopic(slug);
  return {
    title: t?.metaTitle ?? 'GPT-6 工具榜',
    description: t?.metaDescription,
  };
}

export default function Page() {
  return <TopicPage slug={slug} />;
}
