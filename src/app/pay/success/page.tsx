import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PaySuccess({
  searchParams,
}: {
  searchParams: Promise<{ bid?: string }>;
}) {
  const { bid } = await searchParams;

  return (
    <main
      className="flex flex-col items-center justify-center text-center"
      style={{ minHeight: '100dvh', padding: '24px' }}
    >
      <div
        className="w-full max-w-[420px] rounded-xl p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto' }} aria-hidden />
        <h1 className="mt-4 text-lg font-semibold">支付成功，竞价已生效</h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          榜单已实时更新你的排名。每日 00:00（北京时间）在榜金额重置为 $1。
        </p>
        <Link
          href="/"
          className="mt-6 block rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '11px 0' }}
        >
          查看榜单
        </Link>
        {bid && (
          <p className="mt-3 font-mono text-[11px]" style={{ color: 'var(--meta)' }}>
            bid: {bid}
          </p>
        )}
      </div>
    </main>
  );
}
