import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { formatMoney } from '@/lib/format';
import { BadgeCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

/** 北京时间（Asia/Shanghai）YYYY-MM-DD HH:mm，无秒 */
function beijingTime(iso: string): string {
  const d = new Date(iso);
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const bj = new Date(utcMs + 8 * 3600000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${bj.getFullYear()}-${p(bj.getMonth() + 1)}-${p(bj.getDate())} ${p(bj.getHours())}:${p(bj.getMinutes())}`;
}

/** 产品详情页：公开竞价历史（透明审计），参考 cc8.cc 轻量增强版 */
export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);

  if (!listing) {
    return (
      <main className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
        未找到该条目。<a href="/" style={{ color: 'var(--accent)' }}>返回榜单</a>
      </main>
    );
  }

  // 当前名次：金额降序，同额后出价者靠前（lastBidAt 越大越靠前）
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listings)
    .where(
      sql`(${listings.bidAmount}::numeric > ${listing.bidAmount}::numeric OR (${listings.bidAmount}::numeric = ${listing.bidAmount}::numeric AND ${listings.lastBidAt} > ${listing.lastBidAt}))`
    );
  const rank = Number(count) + 1;

  const history = await db
    .select({ amount: bids.amount, method: bids.paymentMethod, createdAt: bids.createdAt })
    .from(bids)
    .where(eq(bids.listingId, id))
    .orderBy(desc(bids.createdAt))
    .limit(50);

  const confirmed = history.filter((b) => b.amount !== null);
  const firstBidIso = confirmed.length
    ? confirmed.reduce(
        (min, b) =>
          new Date(b.createdAt).getTime() < new Date(min).getTime()
            ? new Date(b.createdAt).toISOString()
            : min,
        new Date(confirmed[0].createdAt).toISOString()
      )
    : '';

  // 图标：优先用用户填的 iconUrl，否则按域名自动抓 favicon（零存储）
  let domain = '';
  try {
    domain = new URL(listing.url).hostname;
  } catch {
    domain = '';
  }
  const iconSrc = listing.iconUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '');

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
      <a href="/" className="text-[13px]" style={{ color: 'var(--accent)' }}>
        ← 返回榜单
      </a>

      <header
        className="mt-4 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px' }}
      >
        <div className="flex items-start gap-3">
          {iconSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt=""
              width={44}
              height={44}
              className="mt-0.5 shrink-0 rounded-lg"
              style={{ background: '#fff', border: '1px solid var(--border-soft)' }}
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
                {listing.name}
              </h1>
              {listing.verified && (
                <span
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    background: 'rgba(34,197,94,.12)',
                    color: 'var(--success)',
                    border: '1px solid rgba(34,197,94,.3)',
                  }}
                  title="已通过域名白名单校验"
                  aria-label="已认证"
                >
                  <BadgeCheck size={12} aria-hidden />
                  已认证
                </span>
              )}
            </div>
            {listing.description && (
              <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
                {listing.description}
              </p>
            )}
          </div>
        </div>

        <a
          href={`/api/v1/click/${listing.id}`}
          target="_blank"
          rel="noopener nofollow"
          className="mt-3 inline-flex items-center gap-1.5 text-[13px]"
          style={{ color: 'var(--accent)' }}
        >
          <ExternalLink size={13} aria-hidden />
          访问工具
        </a>

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>当前在榜金额</div>
            <div className="font-mono text-lg font-semibold" style={{ color: 'var(--fg-2)' }}>
              {formatMoney(listing.bidAmount)}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>当前名次</div>
            <div className="font-mono text-lg font-semibold" style={{ color: 'var(--fg-2)' }}>
              #{rank}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>累计投入</div>
            <div className="font-mono text-lg" style={{ color: 'var(--fg-2)' }}>
              {formatMoney(listing.lifetimeAmount)}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>出站点击</div>
            <div className="font-mono text-lg" style={{ color: 'var(--fg-2)' }}>
              {listing.totalClicks}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4">
        <h2 className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>
          竞价历史（公开）
        </h2>
        {confirmed.length === 0 ? (
          <p className="mt-2 text-[13px]" style={{ color: 'var(--meta)' }}>
            暂无记录
          </p>
        ) : (
          <div
            className="mt-2 overflow-hidden rounded-lg"
            style={{ border: '1px solid var(--border-soft)' }}
          >
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ background: 'var(--surface-warm)', color: 'var(--meta)' }}>
                  <th className="px-3 py-2 text-left font-medium">时间（北京时间）</th>
                  <th className="px-3 py-2 text-right font-medium">金额</th>
                  <th className="px-3 py-2 text-right font-medium">类型</th>
                </tr>
              </thead>
              <tbody>
                {confirmed.map((b, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 ? 'var(--surface)' : 'transparent', borderTop: '1px solid var(--border-soft)' }}
                  >
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--fg-2)' }}>
                      {beijingTime(new Date(b.createdAt).toISOString())}
                    </td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--fg-2)' }}>
                      +{formatMoney(b.amount)}
                    </td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--meta)' }}>
                      {new Date(b.createdAt).toISOString() === firstBidIso ? '新条目' : '加价'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
