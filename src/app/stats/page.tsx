import LiveStats from '@/components/LiveStats';

export const dynamic = 'force-dynamic';

export default function StatsPage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          实时统计
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          在榜金额、累计投入与出价动态全部实时刷新；每日 00:00（北京时间）在榜金额重置，累计数据保留。
        </p>
      </header>

      <LiveStats />
    </main>
  );
}
