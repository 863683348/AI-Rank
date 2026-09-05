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
  BadgeCheck,
  Wallet,
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatMoney, timeAgo, msUntilMidnightBeijing } from '@/lib/format';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { TOPIC_SLUGS } from '@/lib/topics';
import { subscribeBoard, subscribeLive, subscribeError } from '@/lib/sse';
import { t, type Locale } from '@/lib/i18n/dict';
import { useClientLocale } from '@/lib/i18n/dict.client';
import AppIcon from './AppIcon';
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
  verified?: boolean;
};

type PayChannel = 'yungouos' | 'waffo';

type RecentBid = {
  id: string;
  name: string;
  amount: string;
  method: string | null;
  createdAt: string;
};

const PAYMENT_CHANNELS: { id: PayChannel; label: Record<Locale, string>; hint: Record<Locale, string> }[] = [
  {
    id: 'waffo',
    label: { zh: '跳转收银台（Waffo）', en: 'Waffo checkout' },
    hint: { zh: '跳转式支付，浏览器完成付款', en: 'Redirect pay, done in browser' },
  },
];

function ChannelPicker({
  value,
  onChange,
  locale,
}: {
  value: PayChannel;
  onChange: (v: PayChannel) => void;
  locale: Locale;
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
            <div className="text-[13px] font-medium">{c.label[locale]}</div>
            <div className="mt-0.5 text-[11px]" style={{ opacity: 0.85 }}>
              {c.hint[locale]}
            </div>
          </button>
        );
      })}
    </div>
  );
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
  defaultCategory,
}: {
  initial: Listing[];
  activeCategory?: string | null;
  defaultCategory?: string;
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
  const catRef = useRef<string | null | undefined>(activeCategory);
  const locale = useClientLocale();

  // 分类切换（软导航）：同步分类引用 + 用服务端新数据重置本地榜单
  useEffect(() => {
    catRef.current = activeCategory;
    setBoard(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, initial]);

  // SSE 实时榜单（共享单例）；带分类筛选时必须在客户端二次过滤，
  // 否则全量推送会在 2 秒内覆盖服务端渲染的分类结果
  useEffect(() => {
    const offBoard = subscribeBoard((data) => {
      const cat = catRef.current;
      const prev = new Map(board.map((l) => [l.id, l.bidAmount]));
      const incoming = cat
        ? data.listings.filter((l) => l.category === cat)
        : data.listings;
      pulseRef.current = new Set(
        incoming.filter((l) => prev.get(l.id) !== l.bidAmount).map((l) => l.id)
      );
      setBoard(incoming);
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
            {live ? (locale === 'zh' ? '实时在线' : 'Live') : (locale === 'zh' ? '连接中' : 'Connecting')}
          </span>
          {clicks !== null && (
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '累计' : 'Total'}{' '}<b style={{ color: 'var(--fg-2)' }}>{clicks.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</b>{' '}
              {locale === 'zh' ? '次访问' : 'visits'}
            </span>
          )}
          {todayBids !== null && (
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '今日' : 'Today'}{' '}<b style={{ color: 'var(--fg-2)' }}>{todayBids}</b>{' '}
              {locale === 'zh' ? '笔出价' : 'bids'}
            </span>
          )}
          <Link
            href="/stats"
            className="text-[13px] font-medium"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            {locale === 'zh' ? '查看实时统计' : 'Live stats'}
          </Link>
        </div>

        {/* 标题 + 一句话介绍 */}
        <h1
          className="mt-6 text-[42px] font-extrabold leading-tight sm:text-[52px]"
          style={{ color: 'var(--fg)', letterSpacing: '-0.03em' }}
        >
          {locale === 'zh' ? (
            <>花小钱，让工具上 <span style={{ color: 'var(--accent)' }}>C 位</span></>
          ) : (
            <>Bid $1+, get your tool on the <span style={{ color: 'var(--accent)' }}>C-spot</span></>
          )}
        </h1>
        <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {locale === 'zh'
            ? '出价 $1 起。低于 C 位的价格也会上榜——排在你的金额能买到的位置。'
            : 'Start at $1. Lower bids still make the board—you rank where your bid can afford.'}
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
              placeholder={locale === 'zh' ? 'App Store 链接或应用名…' : 'App Store link or app name…'}
              className="w-full bg-transparent text-[14px] outline-none"
              style={{ color: 'var(--fg)', height: 44 }}
              aria-label={locale === 'zh' ? '工具链接或应用名' : 'Tool URL or app name'}
            />
          </div>

          <div className="mt-4 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '支付金额' : 'Bid amount'}
          </div>
          {/* 金额步进器 */}
          <div className="mt-2 flex items-center justify-center gap-5">
            <button
              onClick={() => setHeroAmount((m) => Math.max(1, m - 1))}
              aria-label={locale === 'zh' ? '减少金额' : 'Decrease amount'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold"
              style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              −
            </button>
            <span
              className="min-w-[90px] font-mono text-[40px] font-bold"
              style={{ color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}
            >
              ${heroAmount}
            </span>
            <button
              onClick={() => setHeroAmount((m) => m + 1)}
              aria-label={locale === 'zh' ? '增加金额' : 'Increase amount'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold"
              style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              +
            </button>
          </div>

          <div className="mt-3 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '$1 起。每日 0 点（中国时区）全员重置为 $1，不撤榜，重新抢座位。距重置' : 'Start at $1. Daily 00:00 (China tz) everyone resets to $1 — the board stays, seats are re-fought. Reset in'}{' '}
            <Countdown />
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
            {locale === 'zh' ? '抢 C 位' : 'Grab the C-spot'}
          </button>

          <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '已经上榜？再提交同一个链接即可加价——只收差价。' : 'Already listed? Resubmit the same URL to raise your bid — you only pay the difference.'}
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
            {locale === 'zh' ? '这个小小的榜单已进账' : 'This little board has taken in'}
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
            aria-label={`${locale === 'zh' ? '自上线以来已进账' : 'Taken in since launch'} ${formatMoney(lifetime, locale)}`}
          >
            {formatMoney(lifetime, locale)}
          </div>
          <div className="text-center text-[12px]" style={{ color: 'var(--muted)' }}>{locale === 'zh' ? '自上线以来' : 'since launch'} </div>
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
            {t('home.latestBids', locale)}
          </span>
          <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {recentBids.length} {t('home.bidsCount', locale)}
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
                {t('home.noBids', locale)}
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
                    +${Number(b.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="shrink-0" style={{ color: 'var(--meta)' }}>
                    {timeAgo(new Date(b.createdAt).toISOString(), locale)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* 机制说明 */}
      <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
        {t('home.rules', locale)}
      </p>

      {/* 分类筛选（scroll={false}：切分类不跳页首，留在当前滚动位置） */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/"
          scroll={false}
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
          {locale === 'zh' ? '全部' : 'All'}
        </Link>
        {CATEGORIES.map((c) => {
          const active = activeCategory === c.slug;
          const isTopic = TOPIC_SLUGS.has(c.slug);
          return (
            <Link
              key={c.slug}
              href={isTopic ? `/${c.slug}` : `/?cat=${c.slug}`}
              scroll={false}
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
              {categoryLabel(c.slug, locale)}
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
            {locale === 'zh' ? '榜单还是空的。提交你的 AI 工具，$1 起竞价，立刻占据 C 位。' : 'The board is empty. Submit your AI tool, bid from $1, and grab the C-spot in seconds.'}
          </div>
        )}
        {board.map((l, i) => {
          const featured = i < 3;
          return (
          <article
            key={l.id}
            className={`group ${pulseRef.current.has(l.id) ? 'bid-pulse rounded-2xl' : 'rounded-2xl'}`}
            style={{
              background: featured
                ? i === 0
                  ? 'linear-gradient(135deg, rgba(255,213,79,.10), rgba(255,160,0,.04))'
                  : 'linear-gradient(135deg, var(--surface), var(--surface-warm))'
                : 'var(--surface)',
              border: featured ? '1.5px solid rgba(255,213,79,.45)' : '1px solid var(--border)',
              padding: featured ? '22px 24px' : '14px 18px',
              position: 'relative',
              overflow: 'visible',
              transition: 'border-color .15s, box-shadow .15s',
              boxShadow: featured ? '0 8px 32px rgba(255,160,0,.08)' : 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.boxShadow = featured
                ? '0 12px 40px rgba(255,160,0,.18)'
                : '0 4px 20px rgba(37,99,235,.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = featured ? 'rgba(255,213,79,.45)' : 'var(--border)';
              (e.currentTarget as HTMLElement).style.boxShadow = featured ? '0 8px 32px rgba(255,160,0,.08)' : 'none';
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
                {locale === 'zh' ? '最后出价' : 'Last bid'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 8 }}>
                {new Date(l.lastBidAt).toLocaleString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, letterSpacing: '.02em' }}>
                {locale === 'zh' ? '当前金额' : 'Current bid'}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(l.bidAmount, locale)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, letterSpacing: '.02em' }}>
                {locale === 'zh' ? '已进账总额' : 'Total taken'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(l.lifetimeAmount, locale)}
              </div>
            </div>
            <div className={featured ? 'flex items-center gap-5' : 'flex items-center gap-4'}>
              {/* 排名徽章：前三名金银铜大圆形，4+ 用字号 */}
              <div className="flex shrink-0 items-center justify-center" style={{ width: featured ? 88 : 48 }}>
                {i < 3 ? (
                  <div
                    className="flex items-center justify-center rounded-full font-mono font-extrabold"
                    style={{
                      width: featured ? 80 : 44,
                      height: featured ? 80 : 44,
                      fontSize: featured ? (i === 0 ? 40 : 34) : 20,
                      background:
                        i === 0
                          ? 'linear-gradient(135deg, #ffd54f, #ffa000)'
                          : i === 1
                          ? 'linear-gradient(135deg, #e8eaed, #9aa0a6)'
                          : 'linear-gradient(135deg, #d2956b, #8a5a2b)',
                      color: i === 1 ? '#2a2a2a' : '#fff',
                      boxShadow: featured ? '0 6px 24px rgba(255,160,0,.35)' : '0 2px 10px rgba(0,0,0,.18)',
                      textShadow: i === 1 ? 'none' : '0 2px 2px rgba(0,0,0,.18)',
                    }}
                    aria-label={locale === 'zh' ? `第 ${i + 1} 名` : `#${i + 1}`}
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

              {/* 工具图标（iconUrl → 服务端 favicon 代理 → 首字母色块，永不裂图） */}
              <AppIcon name={l.name} url={l.url} iconUrl={l.iconUrl} size={featured ? 72 : 40} className="rounded-xl" />

              {/* 名称 + 描述 + 点击/时间徽章 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate"
                    style={{
                      fontSize: featured ? 26 : 18,
                      fontWeight: 700,
                      color: 'var(--fg)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {l.name}
                  </span>
                  {l.verified && (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                      style={{
                        background: 'rgba(34,197,94,.12)',
                        color: 'var(--success)',
                        border: '1px solid rgba(34,197,94,.3)',
                      }}
                      title={locale === 'zh' ? '已通过域名白名单校验' : 'Passed domain allowlist'}
                      aria-label={locale === 'zh' ? '已认证' : 'Verified'}
                    >
                      <BadgeCheck size={11} aria-hidden />
                      {locale === 'zh' ? '已认证' : 'Verified'}
                    </span>
                  )}
                  <a
                    href={`/api/v1/click/${l.id}`}
                    target="_blank"
                    rel="noopener nofollow"
                    aria-label={locale === 'zh' ? `访问 ${l.name}` : `Visit ${l.name}`}
                    className="shrink-0"
                    style={{ color: 'var(--meta)' }}
                  >
                    <ExternalLink size={featured ? 16 : 13} aria-hidden />
                  </a>
                </div>
                {l.description && (
                  <p
                    className={featured ? 'mt-1 text-[14px] leading-relaxed' : 'truncate text-[13px]'}
                    style={{ color: 'var(--muted)', display: featured ? '-webkit-box' : 'block', WebkitLineClamp: featured ? 2 : 1, WebkitBoxOrient: 'vertical' as any, overflow: featured ? 'hidden' : 'clip' }}
                  >
                    {l.description}
                  </p>
                )}
                <div className={featured ? 'mt-2 flex items-center gap-2.5' : 'mt-1.5 flex items-center gap-2'}>
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
                    {timeAgo(new Date(l.lastBidAt).toISOString(), locale)}
                  </span>
                  {featured && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px]"
                      style={{
                        background: 'rgba(255,160,0,.10)',
                        border: '1px solid rgba(255,160,0,.30)',
                        color: '#ff6a00',
                      }}
                      title={locale === 'zh' ? '已进账总额' : 'Total taken in'}
                    >
                      <Wallet size={12} aria-hidden />
                      {formatMoney(l.lifetimeAmount, locale)}
                    </span>
                  )}
                </div>
              </div>

              {/* 大号金额 + 加价按钮 */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div
                  className="font-mono font-extrabold"
                  style={{
                    fontSize: featured ? (i === 0 ? 'clamp(38px, 6vw, 52px)' : 'clamp(32px, 5vw, 44px)') : 'clamp(20px, 3vw, 24px)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    color: '#ff6a00',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 0 16px rgba(255,106,0,.20)',
                  }}
                >
                  {formatMoney(l.bidAmount, locale)}
                </div>
                <div className={featured ? 'flex items-center gap-3' : 'flex items-center gap-2'}>
                  <Link
                    href={`/listing/${l.id}`}
                    className="flex items-center gap-1.5 rounded-lg text-[13px] font-medium transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'var(--surface-warm)',
                      color: 'var(--fg-2)',
                      border: '1px solid var(--border)',
                      padding: featured ? '10px 16px' : '8px 12px',
                      fontSize: featured ? 14 : 13,
                    }}
                  >
                    <Eye size={featured ? 16 : 14} aria-hidden />
                    {locale === 'zh' ? '查看详情' : 'View'}
                  </Link>
                  <button
                    onClick={() => setBidTarget(l)}
                    className="flex items-center gap-1.5 rounded-lg text-[13px] font-bold transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      padding: featured ? '10px 18px' : '8px 14px',
                      boxShadow: featured ? '0 4px 16px rgba(37,99,235,.35)' : '0 2px 8px rgba(37,99,235,.25)',
                      fontSize: featured ? 14 : 13,
                    }}
                  >
                    <TrendingUp size={featured ? 16 : 14} aria-hidden />
                    {locale === 'zh' ? '抢你的名次' : 'Steal this rank'}
                  </button>
                </div>
              </div>
            </div>
          </article>
          );
        })}
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
        {locale === 'zh' ? '提交你的工具，上 C 位当显眼包（$1 起）' : 'Submit your tool & grab the C-spot spotlight (from $1)'}
      </button>

      {bidTarget && <BidDialog listing={bidTarget} onClose={() => setBidTarget(null)} />}
      {showNew && (
        <NewListingDialog
          onClose={() => setShowNew(false)}
          initialUrl={heroUrl}
          initialAmount={heroAmount}
          initialCategory={defaultCategory}
        />
      )}
    </main>
  );
}

function BidDialog({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const locale = useClientLocale();
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
        locale={locale}
        title={locale === 'zh' ? '前往 Waffo 收银台支付' : 'Go to Waffo checkout'}
        note={locale === 'zh' ? '点击下方按钮将在新窗口打开托管收银台完成付款' : 'Click below to open the hosted checkout in a new window'}
      />
    );
  }

  if (qrDataUrl) {
    return (
      <Overlay onClose={onClose}>
        <h2 className="text-base font-semibold">{locale === 'zh' ? '微信扫码支付' : 'WeChat QR pay'} {formatMoney(payingAmount ?? 0, locale)}</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          {locale === 'zh' ? '打开微信扫一扫，支付成功后将自动上榜。榜单通过 SSE 实时刷新，不用刷新页面。' : 'Scan with WeChat. Once paid you\'ll be listed automatically. The board refreshes live via SSE — no page reload needed.'}
        </p>
        <div className="mt-4 flex justify-center rounded-xl p-4" style={{ background: '#fff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={locale === 'zh' ? '微信支付二维码' : 'WeChat payment QR'} width={220} height={220} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          <Smartphone size={14} aria-hidden />
          {locale === 'zh' ? '扫码后回到此页面即可，无需停留' : 'Return here after scanning — no need to stay'}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg text-sm font-medium"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '11px 0' }}
        >
          {locale === 'zh' ? '我已支付 / 关闭' : 'I\'ve paid / Close'}
        </button>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-base font-semibold">{locale === 'zh' ? `给「${listing.name}」加价` : `Raise bid on “${listing.name}”`}</h2>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
        {locale === 'zh' ? `当前 ${formatMoney(listing.bidAmount, locale)}。支付成功后立即生效，上榜金额 = 累计竞价。` : `Current ${formatMoney(listing.bidAmount, locale)}. Takes effect immediately — your bid equals total ranking amount.`}
      </p>
      <ChannelPicker value={channel} onChange={setChannel} locale={locale} />
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
        aria-label={locale === 'zh' ? '竞价金额' : 'Bid amount'}
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
        {loading ? (locale === 'zh' ? '处理中…' : 'Processing…') : channel === 'waffo' ? (locale === 'zh' ? '前往收银台支付' : 'Go to checkout') : (locale === 'zh' ? '生成支付码' : 'Generate QR')}
      </button>
    </Overlay>
  );
}

function NewListingDialog({
  onClose,
  initialUrl = '',
  initialAmount = 1,
  initialCategory = 'ai-tools',
}: {
  onClose: () => void;
  initialUrl?: string;
  initialAmount?: number;
  initialCategory?: string;
}) {
  const locale = useClientLocale();
  const [form, setForm] = useState({
    url: initialUrl,
    name: '',
    description: '',
    amount: initialAmount,
    category: initialCategory,
    channel: 'waffo' as PayChannel,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);

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

      // 待人工审核：提示用户等待，不进入支付
      if (data.status === 'pending') {
        setPendingMsg(data.message ?? '已提交，待人工审核…');
        return;
      }

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

  if (pendingMsg) {
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(245,158,11,.12)' }}
          >
            <Timer size={22} style={{ color: 'var(--warn)' }} aria-hidden />
          </div>
          <h2 className="mt-3 text-base font-semibold">{locale === 'zh' ? '已提交，待审核' : 'Submitted — pending review'}</h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {pendingMsg}
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '11px 0' }}
          >
            {locale === 'zh' ? '知道了' : 'Got it'}
          </button>
        </div>
      </Overlay>
    );
  }

  if (checkoutUrl) {
    return (
      <CheckoutCard
        amount={form.amount}
        checkoutUrl={checkoutUrl}
        onClose={onClose}
        locale={locale}
        title={locale === 'zh' ? '前往 Waffo 收银台支付' : 'Go to Waffo checkout'}
        note={locale === 'zh' ? '点击下方按钮将在新窗口打开托管收银台完成付款' : 'Click below to open the hosted checkout in a new window'}
      />
    );
  }

  if (qrDataUrl) {
    return (
      <Overlay onClose={onClose}>
        <h2 className="text-base font-semibold">{locale === 'zh' ? '扫码上榜' : 'Scan & get listed'} {formatMoney(form.amount, locale)}</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          {locale === 'zh' ? '微信或支付宝扫一扫均可，支付成功后立即上榜 C 位。榜单通过 SSE 实时刷新。' : 'Scan with WeChat or Alipay. Once paid you\'ll hit the C-spot instantly. The board refreshes live via SSE.'}
        </p>
        <div className="mt-4 flex justify-center rounded-xl p-4" style={{ background: '#fff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={locale === 'zh' ? '支付二维码（微信/支付宝）' : 'Payment QR (WeChat/Alipay)'} width={220} height={220} />
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg text-sm font-medium"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '11px 0' }}
        >
          {locale === 'zh' ? '我已支付 / 关闭' : 'I\'ve paid / Close'}
        </button>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-base font-semibold">{locale === 'zh' ? '提交新工具' : 'Submit a tool'}</h2>
      <div className="mt-4 flex flex-col gap-3">
        <input
          placeholder={locale === 'zh' ? 'https:// 你的工具链接' : 'https:// your tool URL'}
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full rounded-lg text-sm outline-none"
          style={field}
          aria-label={locale === 'zh' ? '工具链接' : 'Tool URL'}
        />
        <input
          placeholder={locale === 'zh' ? '工具名称（60 字内）' : 'Tool name (max 60 chars)'}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg text-sm outline-none"
          style={field}
          aria-label={locale === 'zh' ? '工具名称' : 'Tool name'}
        />
        <input
          placeholder={locale === 'zh' ? '一句话介绍（可选）' : 'One-line description (optional)'}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg text-sm outline-none"
          style={field}
          aria-label={locale === 'zh' ? '一句话介绍' : 'Description'}
        />
        <div className="flex items-center gap-2">
          <span className="text-[13px] shrink-0" style={{ color: 'var(--muted)', width: 52 }}>
            {locale === 'zh' ? '分类' : 'Category'}
          </span>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg text-sm outline-none"
            style={field}
            aria-label={locale === 'zh' ? '工具分类' : 'Tool category'}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {categoryLabel(c.slug, locale)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '首次竞价' : 'Starting bid'}
          </span>
          <input
            type="number"
            min={1}
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="w-28 rounded-lg font-mono text-sm outline-none"
            style={field}
            aria-label={locale === 'zh' ? '首次竞价金额' : 'Starting bid amount'}
          />
        </div>
      </div>
      <ChannelPicker value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} locale={locale} />
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
        {loading ? (locale === 'zh' ? '处理中…' : 'Processing…') : form.channel === 'waffo' ? (locale === 'zh' ? '前往收银台支付' : 'Go to checkout') : (locale === 'zh' ? '生成支付码' : 'Generate QR')}
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
  locale,
}: {
  amount: number;
  checkoutUrl: string;
  onClose: () => void;
  title: string;
  note: string;
  locale: Locale;
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
          {locale === 'zh' ? '应付金额' : 'Amount due'}
        </div>
        <div className="mt-1 font-mono text-[32px] font-bold" style={{ color: '#14161f', letterSpacing: '-0.02em' }}>
          ${amount.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium" style={{ background: '#0d6efd', color: '#fff' }}>
          <Activity size={14} aria-hidden />
          {locale === 'zh' ? 'Waffo 安全收银台' : 'Waffo Secure Checkout'}
        </div>
      </div>

      <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--muted)' }}>
        {locale === 'zh' ? '点击下方按钮前往受限收银台完成付款，金额以收银台为准。' : 'Click below to finish payment on the hosted checkout. The amount shown there is final.'}
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
        {locale === 'zh' ? '前往收银台支付' : 'Go to checkout'}
      </button>

      <div className="mt-3 flex items-center justify-center gap-2 text-[12px]" style={{ color: 'var(--meta)' }}>
        <Loader2 size={13} className="animate-spin" aria-hidden />
        {locale === 'zh' ? '支付完成后自动回到榜单并立即上榜' : 'You\'ll return to the board and be listed automatically once paid'}
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
