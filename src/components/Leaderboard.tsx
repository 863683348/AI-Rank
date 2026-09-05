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
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatMoney, timeAgo, msUntilMidnightBeijing } from '@/lib/format';
import { CATEGORIES } from '@/lib/categories';
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
    <span className="font-mono text-[13px]" style={{ color: 'var(--warn)' }}>
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
  const pulseRef = useRef<Set<string>>(new Set());

  // SSE 实时榜单
  useEffect(() => {
    const es = new EventSource('/api/v1/stream');
    es.addEventListener('open', () => setLive(true));
    es.addEventListener('board', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { listings: Listing[] };
      const prev = new Map(board.map((l) => [l.id, l.bidAmount]));
      pulseRef.current = new Set(
        data.listings.filter((l) => prev.get(l.id) !== l.bidAmount).map((l) => l.id)
      );
      setBoard(data.listings);
    });
    es.addEventListener('error', () => setLive(false));
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自上线以来累计进账
  useEffect(() => {
    fetch('/api/v1/stats')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.lifetime === 'number') setLifetime(d.lifetime);
      })
      .catch(() => {});
  }, []);

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* 顶栏 */}
      <header
        className="flex items-center justify-between rounded-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
        }}
      >
        <div className="flex items-center gap-3">
          <Trophy size={20} style={{ color: 'var(--accent)' }} aria-hidden />
          <h1 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
            AI Rank — AI 工具竞价排行榜
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[13px]" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1.5">
            {live ? (
              <>
                <span
                  className="live-dot inline-block h-2 w-2 rounded-full"
                  style={{ background: 'var(--success)' }}
                />
                实时
              </>
            ) : (
              <Activity size={14} aria-hidden />
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Timer size={14} aria-hidden />
            重置倒计时 <Countdown />
          </span>
        </div>
      </header>

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
                  <span className="truncate text-[15px] font-semibold">{l.name}</span>
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
                <button
                  onClick={() => setBidTarget(l)}
                  className="flex items-center gap-1.5 rounded-lg text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    padding: '8px 16px',
                    boxShadow: '0 2px 8px rgba(37,99,235,.25)',
                  }}
                >
                  <TrendingUp size={14} aria-hidden />
                  加价
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* 上架入口 */}
      <button
        onClick={() => setShowNew(true)}
        className="mx-auto mt-6 flex items-center gap-2 rounded-full text-sm font-medium"
        style={{
          background: 'var(--surface-warm)',
          color: 'var(--fg-2)',
          border: '1px solid var(--border)',
          padding: '10px 20px',
        }}
      >
        <Plus size={15} aria-hidden />
        提交你的工具，上 C 位当显眼包（¥1 起）
      </button>

      {bidTarget && <BidDialog listing={bidTarget} onClose={() => setBidTarget(null)} />}
      {showNew && <NewListingDialog onClose={() => setShowNew(false)} />}
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
        // Waffo：跳转式支付，直接跳转到收银台完成付款
        window.location.href = data.checkoutUrl;
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

function NewListingDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ url: '', name: '', description: '', amount: 1, category: 'ai-tools', channel: 'waffo' as PayChannel });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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

      // Waffo：跳转式支付
      if (form.channel === 'waffo' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
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
