'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Check, X, Lock, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

type PendingItem = {
  id: string;
  url: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: string;
  bidAmount: number;
  verified: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const tokenRef = useRef('');

  const load = useRef(async (t: string) => {
    const res = await fetch(`/api/v1/admin?token=${encodeURIComponent(t)}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '加载失败');
    setItems(data.pending ?? []);
  });

  useEffect(() => {
    const t = tokenRef.current;
    if (t) load.current(t).catch(() => {});
  }, []);

  async function doAction(id: string, action: 'approve' | 'reject') {
    if (!tokenRef.current) return;
    let reason: string | undefined;
    if (action === 'reject') {
      reason = window.prompt('填写拒绝原因（将展示给提交人）：', '不符合上架规范') ?? undefined;
    }
    setBusyId(id);
    setErr('');
    try {
      const res = await fetch('/api/v1/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({ action, listingId: id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '操作失败');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusyId(null);
    }
  }

  function tryLogin() {
    tokenRef.current = token.trim();
    setToken(token.trim());
    setLoading(true);
    setErr('');
    load
      .current(tokenRef.current)
      .then(() => {})
      .catch((e) => setErr(e instanceof Error ? e.message : '鉴权失败'))
      .finally(() => setLoading(false));
  }

  const field = {
    background: 'var(--surface-warm)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    padding: '10px 12px',
  } as const;

  if (!tokenRef.current) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[420px] flex-col items-center justify-center px-4">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--fg)' }}>
          <Lock size={16} style={{ color: 'var(--accent)' }} aria-hidden />
          输入审核口令
        </div>
        <div className="mt-4 w-full rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
            placeholder="ADMIN_TOKEN"
            className="w-full rounded-lg text-sm outline-none"
            style={field}
            aria-label="审核口令"
          />
          {err && (
            <p className="mt-2 text-[13px]" style={{ color: 'var(--danger)' }}>
              {err}
            </p>
          )}
          <button
            onClick={tryLogin}
            disabled={loading || !token}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '11px 0' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ShieldCheck size={15} aria-hidden />}
            登录审核台
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--fg)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent)' }} aria-hidden />
          上架审核
        </div>
        <button
          onClick={() => load.current(tokenRef.current).catch((e) => setErr(e instanceof Error ? e.message : ''))}
          className="flex items-center gap-1.5 rounded-lg text-[13px]"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '7px 12px' }}
        >
          <RefreshCw size={13} aria-hidden />
          刷新
        </button>
      </div>

      {err && (
        <p className="mt-3 text-[13px]" style={{ color: 'var(--danger)' }}>
          {err}
        </p>
      )}

      <div className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
        待审核 <b style={{ color: 'var(--fg-2)' }}>{items.length}</b> 条
      </div>

      {items.length === 0 ? (
        <div
          className="mt-4 rounded-xl p-10 text-center text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          没有待审核的条目。
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((it) => {
            const domain = (() => {
              try {
                return new URL(it.url).hostname;
              } catch {
                return it.url;
              }
            })();
            return (
              <div
                key={it.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-bold" style={{ color: 'var(--fg)' }}>
                        {it.name}
                      </span>
                      {it.verified && (
                        <span
                          className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                          style={{ background: 'rgba(34,197,94,.15)', color: 'var(--success)', border: '1px solid rgba(34,197,94,.3)' }}
                        >
                          域名白名单
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-[12px]" style={{ color: 'var(--meta)' }}>
                      {domain} · {it.category} · ¥{it.bidAmount}
                    </div>
                    {it.description && (
                      <div className="mt-1 truncate text-[13px]" style={{ color: 'var(--muted)' }}>
                        {it.description}
                      </div>
                    )}
                  </div>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="shrink-0"
                    style={{ color: 'var(--accent)' }}
                    aria-label="打开链接"
                  >
                    <ExternalLink size={15} aria-hidden />
                  </a>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => doAction(it.id, 'approve')}
                    disabled={busyId === it.id}
                    className="flex items-center gap-1.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '8px 16px' }}
                  >
                    <Check size={14} aria-hidden />
                    通过
                  </button>
                  <button
                    onClick={() => doAction(it.id, 'reject')}
                    disabled={busyId === it.id}
                    className="flex items-center gap-1.5 rounded-lg text-[13px] font-medium"
                    style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--danger)', padding: '8px 16px' }}
                  >
                    <X size={14} aria-hidden />
                    拒绝
                  </button>
                  {busyId === it.id && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--muted)' }} aria-hidden />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
