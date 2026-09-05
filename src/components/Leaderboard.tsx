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
import ThemeToggle from '@/components/ThemeToggle';

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

export default function Leaderboard({ initial }: { initial: Listing[] }) {
  const [board, setBoard] = useState<Listing[]>(initial);
  const [live, setLive] = useState(false);
  const [bidTarget, setBidTarget] = useState<Listing | null>(null);
  const [showNew, setShowNew] = useState(false);
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
          <ThemeToggle />
        </div>
      </header>

      {/* 机制说明 */}
      <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
        金额即排名，花小钱上 C 位、当显眼包；每一笔公开可审计。每日 00:00（北京时间）在榜金额重置为 ¥1，条目与点击数保留。
      </p>

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
            className={pulseRef.current.has(l.id) ? 'bid-pulse rounded-xl' : 'rounded-xl'}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '14px 18px',
            }}
          >
            <div className="flex items-center gap-4">
              <span
                className="font-mono text-xl font-semibold"
                style={{ width: '40px', color: i < 3 ? 'var(--accent)' : 'var(--meta)' }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium">{l.name}</span>
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
              </div>
              <div className="hidden items-center gap-1 text-[13px] sm:flex" style={{ color: 'var(--muted)' }}>
                <MousePointerClick size={13} aria-hidden />
                {l.totalClicks}
              </div>
              <div className="text-right">
                <div
                  className="font-mono text-[17px] font-semibold"
                  style={{ letterSpacing: '-0.01em', color: 'var(--fg-2)' }}
                >
                  {formatMoney(l.bidAmount)}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--meta)' }}>
                  {timeAgo(new Date(l.lastBidAt).toISOString())}
                </div>
              </div>
              <button
                onClick={() => setBidTarget(l)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  padding: '8px 14px',
                }}
              >
                <TrendingUp size={14} aria-hidden />
                竞价
              </button>
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
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '创建支付失败');
      // 把支付链接渲染为二维码（微信/支付宝均可扫）；不在网页内跳转
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
  }, [listing.id, amount]);

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
        ) : (
          <QrCode size={15} aria-hidden />
        )}
        生成微信支付码
      </button>
    </Overlay>
  );
}

function NewListingDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ url: '', name: '', description: '', amount: 1 });
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
        ) : (
          <QrCode size={15} aria-hidden />
        )}
        生成支付码
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
