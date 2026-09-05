'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Trophy,
  TrendingUp,
  MousePointerClick,
  Timer,
  Activity,
  ExternalLink,
  Plus,
  X,
  Loader2,
  QrCode,
  Smartphone,
  Link2,
  ChevronDown,
  Eye,
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatMoney, timeAgo, msUntilMidnightBeijing } from '@/lib/format';
import { CATEGORIES } from '@/lib/categories';
import { subscribeBoard, subscribeLive, subscribeError } from '@/lib/sse';
import Link from 'next/link';

type Listing = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  bidAmount: string;
  lifetimeAmount: string;
  totalClicks: number;
  lastBidAt: string | Date;
};

type PayChannel = 'yungouos' | 'waffo';

type RecentBid = {
  id: string;
  name: string;
  amount: string;
  method: string | null;
  createdAt: string;
};

const PAYMENT_CHANNELS: { id: PayChannel; label: string; hint: string }[] = [
  { id: 'waffo', label: '跳转收银台（Waffo）', hint: '跳转式支付，浏览器完成付款' },
];

function ChannelPicker({
  value,
  onChange,
}: {
  value: PayChannel;
  onChange: (v: PayChannel) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {PAYMENT_CHANNELS.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className="rounded-lg text-left"
            style={{
              background: active ? 'var(--accent)' : 'var(--surface-warm)',
              color: active ? 'var(--accent-on)' : 'var(--fg-2)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              padding: '9px 12px',
              transition: 'background .15s, border-color .15s',
            }}
          >
            <div className="text-[13px] font-medium">{c.label}</div>
            <div className="mt-0.5 text-[11px]" style={{ opacity: 0.85 }}>
              {c.hint}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function iconSrcFor(l: Listing): string {
  if (l.iconUrl) return l.iconUrl;
  try {
    const domain = new URL(l.url).hostname;
    return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';
  } catch {
    return '';
  }
}

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
    <span
      className="font-mono"
      style={{
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: 'var(--warn)',
        padding: '4px 10px',
        borderRadius: 8,
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        textShadow: '0 0 8px rgba(245, 158, 11, 0.35)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

export default function Leaderboard({
  initial,
  activeCategory,
}: {
  initial: Listing[];
  activeCategory?: string | null;
}) {
  const [board, setBoard] = useState<Listing[]>(initial);
  const [live, setLive] = useState(false);
  const [bidTarget, setBidTarget] = useState<Listing | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [lifetime, setLifetime] = useState<number | null>(null);
  const [clicks, setClicks] = useState<number | null>(null);
  const [todayBids, setTodayBids] = useState<number | null>(null);
  const [heroAmount, setHeroAmount] = useState(1);
  const [heroUrl, setHeroUrl] = useState('');
  const [recentBids, setRecentBids] = useState<RecentBid[]>([]);
  const [recentOpen, setRecentOpen] = useState(false);
  const pulseRef = useRef<Set<string>>(new Set());

  // SSE 实时榜单（共享单例）
  useEffect(() => {
    const offBoard = subscribeBoard((data) => {
      const prev = new Map(board.map((l) => [l.id, l.bidAmount]));
      pulseRef.current = new Set(
        data.listings.filter((l) => prev.get(l.id) !== l.bidAmount).map((l) => l.id)
      );
      setBoard(data.listings);
    });
    const offLive = subscribeLive(() => setLive(true));
    const offError = subscribeError(() => setLive(false));
    return () => {
      offBoard();
      offLive();
      offError();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 首页聚合数据：累计进账 / 访问 / 今日出价 + 最新出价
  useEffect(() => {
    fetch('/api/v1/stats')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.lifetime === 'number') setLifetime(d.lifetime);
        if (typeof d.clicks === 'number') setClicks(d.clicks);
        if (typeof d.todayBids === 'number') setTodayBids(d.todayBids);
      })
      .catch(() => {});
    fetch('/api/v1/activity')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRecentBids(d);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* HERO：一句话介绍 + 大提交区域 */}
      <section className="flex flex-col items-center text-center">
        {/* 顶部信息条：品牌 + 实时 + 访问 + 今日出价 + 实时统计 */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-5 py-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
            <Trophy size={14} style={{ color: 'var(--accent)' }} aria-hidden />
            AI Rank
          </span>
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>
            <span
              className="live-dot inline-block h-2 w-2 rounded-full"
              style={{ background: live ? 'var(--success)' : 'var(--meta)' }}
            />
            {live ? '实时在线' : '连接中'}
          </span>
          {clicks !== null && (
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              累计 <b style={{ color: 'var(--fg-2)' }}>{clicks.toLocaleString('zh-CN')}</b> 次访问
            </span>
          )}
          {todayBids !== null && (
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              今日 <b style={{ color: 'var(--fg-2)' }}>{todayBids}</b> 笔出价
            </span>
          )}
          <Link
            href="/stats"
            className="text-[13px] font-medium"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            查看实时统计
          </Link>
        </div>

        {/* 标题 + 一句话介绍 */}
        <h1
          className="mt-6 text-[42px] font-extrabold leading-tight sm:text-[52px]"
          style={{ color: 'var(--fg)', letterSpacing: '-0.03em' }}
        >
          花小钱，让工具上 <span style={{ color: 'var(--accent)' }}>C 位</span>
        </h1>
        <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          出价 ¥1 起。低于 C 位的价格也会上榜——排在你的金额能买到的位置。
        </p>

        {/* 大提交区域 */}
        <div
          className="mt-8 w-full max-w-[520px] rounded-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '22px 22px 18px',
            boxShadow: '0 12px 40px rgba(37,99,235,.08)',
          }}
        >
          {/* 链接输入 */}
          <div
            className="flex items-center gap-2 rounded-xl px-4"
            style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            <Link2 size={16} aria-hidden />
            <input
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="App Store 链接或应用名…"
              className="w-full bg-transparent text-[14px] outline-none"
              style={{ color: 'var(--fg)', height: 44 }}
              aria-label="工具链接或应用名"
            />
          </div>

          <div className="mt-4 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            支付金额
          </div>
          {/* 金额步进器 */}
          <div className="mt-2 flex items-center justify-center gap-5">
            <button
              onClick={() => setHeroAmount((m) => Math.max(1, m - 1))}
              aria-label="减少金额"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold"
              style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              −
            </button>
            <span
              className="min-w-[90px] font-mono text-[40px] font-bold"
              style={{ color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}
            >
              ¥{heroAmount}
            </span>
            <button
              onClick={() => setHeroAmount((m) => m + 1)}
              aria-label="增加金额"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold"
              style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              +
            </button>
          </div>

          <div className="mt-3 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            ¥1 起。每日 0 点（中国时区）全员重置为 ¥1，不撤榜，重新抢座位。距重置 <Countdown />
          </div>

          {/* 抢 C 位 */}
          <button
            onClick={() => setShowNew(true)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl text-[16px] font-bold"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-on)',
              padding: '14px 0',
              boxShadow: '0 8px 24px rgba(37,99,235,.32)',
            }}
          >
            <Plus size={18} aria-hidden />
            抢 C 位
          </button>

          <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--muted)' }}>
            已经上榜？再提交同一个链接即可加价——只收差价。
          </p>
        </div>
      </section>

      {/* 已进账横幅（自上线以来） */}
      {lifetime !== null && (
        <section
          className="flex flex-col items-center rounded-xl"
          style={{
            background: 'var(--surface-warm)',
            border: '1px solid var(--border)',
            marginTop: 14,
            padding: '18px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '.02em' }}>
            这个小小的榜单已进账
          </div>
          <div
            className="font-mono font-bold"
            style={{
              color: '#ff6a00',
              fontSize: 'clamp(34px, 6vw, 46px)',
              lineHeight: 1.15,
              margin: '6px 0',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}
            aria-label={`自上线以来已进账 ${formatMoney(lifetime)}`}
          >
            {formatMoney(lifetime)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>自上线以来</div>
        </section>
      )}

      {/* 最新出价（公开审计流，可折叠） */}
      <section
        className="mt-4 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setRecentOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4"
        >
          <span className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--success)' }} />
            最新出价
          </span>
          <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {recentBids.length} 笔
            <ChevronDown
              size={15}
              aria-hidden
              style={{ transform: recentOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
            />
          </span>
        </button>
        {recentOpen && (
          <div className="flex flex-col gap-3 border-t px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            {recentBids.length === 0 ? (
              <div className="text-[13px]" style={{ color: 'var(--muted)' }}>
                还没有出价，抢先占 C 位。
              </div>
            ) : (
              recentBids.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-[13px]">
                  <span className="truncate" style={{ color: 'var(--fg-2)', flex: 1, marginRight: 12 }}>
                    {b.name}
                  </span>
                  <span
                    className="shrink-0 font-mono font-semibold"
                    style={{ color: 'var(--accent)', marginRight: 12 }}
                  >
                    +¥{Number(b.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="shrink-0" style={{ color: 'var(--meta)' }}>
                    {timeAgo(new Date(b.createdAt).toISOString())}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* 机制说明 */}
      <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
        金额即排名，花小钱上 C 位、当显眼包；每一笔公开可审计。每日 00:00（北京时间）在榜金额重置为 ¥1，条目与点击数保留。
      </p>

      {/* 分类筛选 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            fontSize: 12,
            padding: '5px 11px',
            borderRadius: 999,
            color: activeCategory ? 'var(--muted)' : 'var(--accent-on)',
            background: activeCategory ? 'var(--surface-warm)' : 'var(--accent)',
            border: '1px solid var(--border)',
          }}
        >
          全部
        </Link>
        {CATEGORIES.map((c) => {
          const active = activeCategory === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/?cat=${c.slug}`}
              style={{
                textDecoration: 'none',
                fontSize: 12,
                padding: '5px 11px',
                borderRadius: 999,
                color: active ? 'var(--accent-on)' : 'var(--muted)',
                background: active ? 'var(--accent)' : 'var(--surface-warm)',
                border: '1px solid var(--border)',
              }}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* 榜单 */}
      <section className="mt-4 flex flex-col gap-2">
        {board.length === 0 && (
          <div
            className="rounded-xl p-10 text-center text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            榜单还是空的。提交你的 AI 工具，¥1 起竞价，立刻占据 C 位。
          </div>
        )}
        {board.map((l, i) => (
          <article
            key={l.id}
            className={`group ${pulseRef.current.has(l.id) ? 'bid-pulse rounded-xl' : 'rounded-xl'}`}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '14px 18px',
              position: 'relative',
              overflow: 'visible',
              transition: 'border-color .15s, box-shadow .15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(37,99,235,.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {/* 悬浮提示：最后出价时间 / 当前金额 / 已进账总额 */}
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                zIndex: 30,
                background: 'var(--surface)',
                border: '1px solid var(--accent)',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 200,
                boxShadow: '0 8px 32px rgba(37,99,235,.2)',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity .15s, transform .15s',
                transform: 'translateY(6px)',
              }}
              className="group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0"
            >
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, letterSpacing: '.02em' }}>
                最后出价
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 8 }}>
                {new Date(l.lastBidAt).toLocaleString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, letterSpacing: '.02em' }}>
                当前金额
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(l.bidAmount)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, letterSpacing: '.02em' }}>
                已进账总额
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(l.lifetimeAmount)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 排名徽章：前三名金银铜圆形 */}
              <div className="flex shrink-0 items-center justify-center" style={{ width: 48 }}>
                {i < 3 ? (
                  <div
                    className="flex items-center justify-center rounded-full font-mono font-extrabold"
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: 20,
                      background:
                        i === 0
                          ? 'linear-gradient(135deg, #ffd54f, #ffa000)'
                          : i === 1
                          ? 'linear-gradient(135deg, #e8eaed, #9aa0a6)'
                          : 'linear-gradient(135deg, #d2956b, #8a5a2b)',
                      color: i === 1 ? '#2a2a2a' : '#fff',
                      boxShadow: '0 2px 10px rgba(0,0,0,.18)',
                      textShadow: i === 1 ? 'none' : '0 1px 1px rgba(0,0,0,.18)',
                    }}
                    aria-label={`第 ${i + 1} 名`}
                  >
                    {i + 1}
                  </div>
                ) : (
                  <span
                    className="font-mono text-[22px] font-semibold"
                    style={{ color: 'var(--meta)' }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              {/* 工具图标（iconUrl 或域名 favicon 兜底） */}
              {iconSrcFor(l) && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={iconSrcFor(l)}
                  alt=""
                  width={40}
                  height={40}
                  className="shrink-0 rounded-lg"
                  style={{
                    background: 'var(--surface-warm)',
                    border: '1px solid var(--border)',
                    objectFit: 'contain',
                  }}
                />
              )}

              {/* 名称 + 描述 + 点击/时间徽章 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate"
                    style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.01em' }}
                  >
                    {l.name}
                  </span>
                  <a
                    href={`/api/v1/click/${l.id}`}
                    target="_blank"
                    rel="noopener nofollow"
                    aria-label={`访问 ${l.name}`}
                    className="shrink-0"
                    style={{ color: 'var(--meta)' }}
                  >
                    <ExternalLink size={13} aria-hidden />
                  </a>
                </div>
                {l.description && (
                  <p className="truncate text-[13px]" style={{ color: 'var(--muted)' }}>
                    {l.description}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px]"
                    style={{
                      background: 'var(--surface-warm)',
                      border: '1px solid var(--border)',
                      color: 'var(--fg-2)',
                    }}
                  >
                    <MousePointerClick size={12} aria-hidden />
                    {l.totalClicks.toLocaleString('zh-CN')}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[12px]"
                    style={{ color: 'var(--meta)' }}
                  >
                    <Timer size={12} aria-hidden />
                    {timeAgo(new Date(l.lastBidAt).toISOString())}
                  </span>
                </div>
              </div>

              {/* 大号金额 + 加价按钮 */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div
                  className="font-mono font-extrabold"
                  style={{
                    fontSize: i < 3 ? 'clamp(24px, 4vw, 30px)' : 'clamp(20px, 3vw, 24px)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    color: i < 3 ? '#ff6a00' : 'var(--fg-2)',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: i < 3 ? '0 0 12px rgba(255,106,0,.18)' : 'none',
                  }}
                >
                  {formatMoney(l.bidAmount)}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/listing/${l.id}`}
                    className="flex items-center gap-1.5 rounded-lg text-[13px] font-medium transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'var(--surface-warm)',
                      color: 'var(--fg-2)',
                      border: '1px solid var(--border)',
                      padding: '8px 12px',
                    }}
                  >
                    <Eye size={14} aria-hidden />
                    查看详情
                  </Link>
                  <button
                    onClick={() => setBidTarget(l)}
                    className="flex items-center gap-1.5 rounded-lg text-[13px] font-bold transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      padding: '8px 14px',
                      boxShadow: '0 2px 8px rgba(37,99,235,.25)',
                    }}
                  >
                    <TrendingUp size={14} aria-hidden />
                    抢你的名次
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* 上架入口 — 突出 */}
      <button
        onClick={() => setShowNew(true)}
        className="mx-auto mt-8 flex items-center gap-2 rounded-full text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-on)',
          border: 'none',
          padding: '14px 28px',
          boxShadow: '0 8px 28px rgba(37,99,235,.35)',
        }}
      >
        <Plus size={18} aria-hidden />
        提交你的工具，上 C 位当显眼包（¥1 起）
      </button>

      {bidTarget && <BidDialog listing={bidTarget} onClose={() => setBidTarget(null)} />}
      {showNew && (
        <NewListingDialog
          onClose={() => setShowNew(false)}
          initialUrl={heroUrl}
          initialAmount={heroAmount}
        />
      )}
    </main>
  );
}

function BidDialog({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [amount, setAmount] = useState(1);
  const [channel, setChannel] = useState<'yungouos' | 'waffo'>('waffo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payingAmount, setPayingAmount] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/listings/${listing.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '创建支付失败');

      if (channel === 'waffo' && data.checkoutUrl) {
        // Waffo：先弹出收银台确认卡片，点击按钮再跳转收银台
        setCheckoutUrl(data.checkoutUrl);
        setPayingAmount(amount);
        return;
      }

      // YunGouOS：渲染二维码
      if (!data.codeUrl) throw new Error('未获取到支付二维码');
      const dataUrl = await QRCode.toDataURL(data.codeUrl, {
        margin: 1,
        width: 220,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      setQrDataUrl(dataUrl);
      setPayingAmount(amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建支付失败');
    } finally {
      setLoading(false);
    }
  }, [listing.id, amount, channel, onClose]);

  if (checkoutUrl) {
    return (
      <CheckoutCard
        amount={payingAmount ?? amount}
        checkoutUrl={checkoutUrl}
        onClose={onClose}
        title="前往 Waffo 收银台支付"
        note="点击下方按钮将在新窗口打开托管收银台完成付款"
      />
    );
  }

  if (qrDataUrl) {
    return (
      <Overlay onClose={onClose}>
        <h2 className="text-base font-semibold">微信扫码支付 {formatMoney(payingAmount ?? 0)}</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          打开微信扫一扫，支付成功后将自动上榜。榜单通过 SSE 实时刷新，不用刷新页面。
        </p>
        <div className="mt-4 flex justify-center rounded-xl p-4" style={{ background: '#fff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="微信支付二维码" width={220} height={220} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          <Smartphone size={14} aria-hidden />
          扫码后回到此页面即可，无需停留
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg text-sm font-medium"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '11px 0' }}
        >
          我已支付 / 关闭
        </button>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-base font-semibold">给「{listing.name}」加价</h2>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
        当前 {formatMoney(listing.bidAmount)}。支付成功后立即生效，上榜金额 = 累计竞价。
      </p>
      <ChannelPicker value={channel} onChange={setChannel} />
      <div className="mt-4 flex gap-2">
        {[1, 10, 100].map((v) => (
          <button
            key={v}
            onClick={() => setAmount((a) => a + v)}
            className="rounded-lg text-[13px]"
            style={{
              background: 'var(--surface-warm)',
              color: 'var(--fg-2)',
              border: '1px solid var(--border)',
              padding: '6px 12px',
            }}
          >
            +{v}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={1}
        value={amount || ''}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mt-3 w-full rounded-lg font-mono text-lg outline-none"
        style={{
          background: 'var(--surface-warm)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          padding: '10px 14px',
        }}
        aria-label="竞价金额"
      />
      {error && (
        <p className="mt-2 text-[13px]" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      <button
        onClick={submit}
        disabled={loading || amount < 1}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg text-sm font-medium disabled:opacity-50"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '11px 0' }}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : channel === 'waffo' ? (
          <ExternalLink size={15} aria-hidden />
        ) : (
          <QrCode size={15} aria-hidden />
        )}
        {loading ? '处理中…' : channel === 'waffo' ? '前往收银台支付' : '生成支付码'}
      </button>
    </Overlay>
  );
}

function NewListingDialog({
  onClose,
  initialUrl = '',
  initialAmount = 1,
}: {
  onClose: () => void;
  initialUrl?: string;
  initialAmount?: number;
}) {
  const [form, setForm] = useState({
    url: initialUrl,
    name: '',
    description: '',
    amount: initialAmount,
    category: 'ai-tools',
    channel: 'waffo' as PayChannel,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '创建失败');

      // Waffo：先弹出收银台确认卡片，点击按钮再跳转收银台
      if (form.channel === 'waffo' && data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        return;
      }

      if (!data.codeUrl) throw new Error('未获取到支付二维码');
      const dataUrl = await QRCode.toDataURL(data.codeUrl, {
        margin: 1,
        width: 220,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  const field = {
    background: 'var(--surface-warm)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    padding: '9px 12px',
  } as const;

  if (checkoutUrl) {
    return (
      <CheckoutCard
        amount={form.amount}
        checkoutUrl={checkoutUrl}
        onClose={onClose}
        title="前往 Waffo 收银台支付"
        note="点击下方按钮将在新窗口打开托管收银台完成付款"
      />
    );
  }

  if (qrDataUrl) {
    return (
      <Overlay onClose={onClose}>
        <h2 className="text-base font-semibold">扫码上榜 {formatMoney(form.amount)}</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          微信或支付宝扫一扫均可，支付成功后立即上榜 C 位。榜单通过 SSE 实时刷新。
        </p>
        <div className="mt-4 flex justify-center rounded-xl p-4" style={{ background: '#fff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="支付二维码（微信/支付宝）" width={220} height={220} />
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg text-sm font-medium"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '11px 0' }}
        >
          我已支付 / 关闭
        </button>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-base font-semibold">提交新工具</h2>
      <div className="mt-4 flex flex-col gap-3">
        <input
          placeholder="https:// 你的工具链接"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full rounded-lg text-sm outline-none"
          style={field}
          aria-label="工具链接"
        />
        <input
          placeholder="工具名称（60 字内）"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg text-sm outline-none"
          style={field}
          aria-label="工具名称"
        />
        <input
          placeholder="一句话介绍（可选）"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg text-sm outline-none"
          style={field}
          aria-label="一句话介绍"
        />
        <div className="flex items-center gap-2">
          <span className="text-[13px] shrink-0" style={{ color: 'var(--muted)', width: 52 }}>
            分类
          </span>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg text-sm outline-none"
            style={field}
            aria-label="工具分类"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            首次竞价
          </span>
          <input
            type="number"
            min={1}
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="w-28 rounded-lg font-mono text-sm outline-none"
            style={field}
            aria-label="首次竞价金额"
          />
        </div>
      </div>
      <ChannelPicker value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} />
      {error && (
        <p className="mt-2 text-[13px]" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      <button
        onClick={submit}
        disabled={loading || !form.url || !form.name || form.amount < 1}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg text-sm font-medium disabled:opacity-50"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '11px 0' }}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : form.channel === 'waffo' ? (
          <ExternalLink size={15} aria-hidden />
        ) : (
          <QrCode size={15} aria-hidden />
        )}
        {loading ? '处理中…' : form.channel === 'waffo' ? '前往收银台支付' : '生成支付码'}
      </button>
    </Overlay>
  );
}

function CheckoutCard({
  amount,
  checkoutUrl,
  onClose,
  title,
  note,
}: {
  amount: number;
  checkoutUrl: string;
  onClose: () => void;
  title: string;
  note: string;
}) {
  return (
    <Overlay onClose={onClose}>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
        {note}
      </p>

      {/* 收款卡片：白底、居中、大号金额 */}
      <div className="mt-4 rounded-xl p-6 text-center" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div className="text-[12px] font-medium" style={{ color: '#9a9aa2' }}>
          应付金额
        </div>
        <div className="mt-1 font-mono text-[32px] font-bold" style={{ color: '#14161f', letterSpacing: '-0.02em' }}>
          ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium" style={{ background: '#0d6efd', color: '#fff' }}>
          <Activity size={14} aria-hidden />
          Waffo 安全收银台
        </div>
      </div>

      <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--muted)' }}>
        点击下方按钮前往受限收银台完成付款，金额以收银台为准。
      </p>

      <button
        onClick={() => {
          window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
          onClose();
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg text-sm font-medium"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '11px 0' }}
      >
        <ExternalLink size={15} aria-hidden />
        前往收银台支付
      </button>

      <div className="mt-3 flex items-center justify-center gap-2 text-[12px]" style={{ color: 'var(--meta)' }}>
        <Loader2 size={13} className="animate-spin" aria-hidden />
        支付完成后自动回到榜单并立即上榜
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-backdrop)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[420px] rounded-xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="关闭" style={{ color: 'var(--meta)' }}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
