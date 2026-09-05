'use client';

import { useEffect, useState } from 'react';
import { Activity, MousePointerClick, TrendingUp, Trophy, Coins, RefreshCw } from 'lucide-react';
import { formatMoney, timeAgo, msUntilMidnightBeijing } from '@/lib/format';
import { subscribeBoard, subscribeLive, subscribeError } from '@/lib/sse';
import { useClientLocale } from '@/lib/i18n/dict.client';

type Stats = {
  listings: number;
  onBoard: number;
  lifetime: number;
  clicks: number;
  todayBids: number;
  todayAmount: number;
};

type ActivityItem = {
  id: string;
  name: string;
  amount: string;
  method: string;
  createdAt: string;
};

function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilMidnightBeijing());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (ms === null) return null;
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return (
    <span className="font-mono" style={{ color: 'var(--warn)' }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  live,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 18px',
      }}
    >
      <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
        {icon}
        <span className="text-[12px]">{label}</span>
        {live && (
          <span
            className="ml-auto inline-block h-2 w-2 rounded-full"
            style={{ background: 'var(--success)' }}
          />
        )}
      </div>
      <div
        className="mt-2 font-mono text-[22px] font-semibold"
        style={{ letterSpacing: '-0.02em', color: 'var(--fg)' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[12px]" style={{ color: 'var(--meta)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function LiveStats() {
  const locale = useClientLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [live, setLive] = useState(false);
  const [boardTotal, setBoardTotal] = useState<number | null>(null);
  const [boardCount, setBoardCount] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch('/api/v1/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

    const poll = () =>
      fetch('/api/v1/activity')
        .then((r) => r.json())
        .then(setActivity)
        .catch(() => {});
    poll();
    const t = setInterval(poll, 4000);

    const offBoard = subscribeBoard((d) => {
      const ls = d.listings;
      setBoardCount(ls.length);
      setBoardTotal(ls.reduce((s, l) => s + parseFloat(l.bidAmount), 0));
    });
    const offLive = subscribeLive(() => setLive(true));
    const offError = subscribeError(() => setLive(false));

    return () => {
      clearInterval(t);
      offBoard();
      offLive();
      offError();
    };
  }, []);

  const methodLabel = (m: string) =>
    m === 'yungouos' ? '微信/支付宝' : m === 'stripe' ? 'Stripe' : m;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI 网格 */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        <Kpi
          icon={<Trophy size={14} aria-hidden />}
          label="在榜条目"
          value={boardCount != null ? String(boardCount) : stats ? String(stats.listings) : '—'}
          live
        />
        <Kpi
          icon={<Coins size={14} aria-hidden />}
          label="当前在榜总额"
          value={boardTotal != null ? formatMoney(boardTotal, locale) : stats ? formatMoney(stats.onBoard, locale) : '—'}
          live
        />
        <Kpi
          icon={<TrendingUp size={14} aria-hidden />}
          label="累计投入"
          value={stats ? formatMoney(stats.lifetime, locale) : '—'}
          sub="不受每日重置影响"
        />
        <Kpi
          icon={<MousePointerClick size={14} aria-hidden />}
          label="累计点击"
          value={stats ? stats.clicks.toLocaleString('zh-CN') : '—'}
        />
        <Kpi
          icon={<Activity size={14} aria-hidden />}
          label="今日出价"
          value={stats ? `${stats.todayBids} 笔` : '—'}
          sub={stats ? `今日 ${formatMoney(stats.todayAmount, locale)}` : undefined}
        />
        <Kpi
          icon={<RefreshCw size={14} aria-hidden />}
          label="距重置"
          value=""
          sub="北京时间 00:00"
        />
      </section>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: 13,
          color: 'var(--muted)',
        }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: live ? 'var(--success)' : 'var(--meta)' }}
        />
        {live ? '实时连接已建立（SSE）' : '正在连接实时流…'}
        <span style={{ marginLeft: 'auto' }}>
          重置倒计时 <Countdown />
        </span>
      </div>

      {/* 实时动态流 */}
      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
        }}
      >
        <h2 className="text-[15px] font-medium" style={{ marginBottom: 12 }}>
          实时出价动态
        </h2>
        {activity.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            还没有出价记录。提交工具并支付后，这里会出现第一笔动态。
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 text-[13px]"
                style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="truncate" style={{ color: 'var(--fg-2)' }}>
                    {a.name}
                  </span>{' '}
                  <span style={{ color: 'var(--meta)' }}>· {methodLabel(a.method)}</span>
                </span>
                <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>
                  {formatMoney(a.amount, locale)}
                </span>
                <span style={{ color: 'var(--meta)', width: 64, textAlign: 'right' }}>
                  {timeAgo(a.createdAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
