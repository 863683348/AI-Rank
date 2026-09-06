'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Check, X, Lock, ExternalLink, ShieldCheck, RefreshCw, Search, Inbox, Wrench } from 'lucide-react';

type Item = {
  id: string;
  url: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: string;
  bidAmount: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_LABEL: Record<StatusFilter, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  all: '全部',
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const tokenRef = useRef('');

  // Waffo 自检
  const [probeAmt, setProbeAmt] = useState('9.99');
  const [probeBusy, setProbeBusy] = useState(false);
  const [probe, setProbe] = useState<any>(null);
  const [probeErr, setProbeErr] = useState('');

  const authHeader = () => ({ Authorization: `Bearer ${tokenRef.current}` });

  const load = async () => {
    const params = new URLSearchParams();
    params.set('token', tokenRef.current);
    params.set('status', status);
    if (search) params.set('search', search);
    const res = await fetch(`/api/v1/admin?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '加载失败');
    setItems(data.items ?? []);
    setSelected(new Set()); // 切筛选后清空选择
  };

  useEffect(() => {
    if (!tokenRef.current) return;
    setLoading(true);
    load().catch((e) => setErr(e instanceof Error ? e.message : '加载失败')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  async function doAction(ids: string[], action: 'approve' | 'reject') {
    if (!tokenRef.current || ids.length === 0) return;
    let reason: string | undefined;
    if (action === 'reject') {
      reason = window.prompt(`拒绝 ${ids.length} 条，填写原因（将展示给提交人）：`, '不符合上架规范') ?? undefined;
      // 用户取消
      if (reason === undefined) return;
    }
    if (ids.length > 1) setBatchBusy(true);
    else setBusyId(ids[0]);
    setErr('');
    try {
      const res = await fetch('/api/v1/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action, listingIds: ids, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '操作失败');
      // 本地乐观更新：批准后从 pending 视图消失 / 拒绝同理（status=pending 视图里直接过滤掉）
      setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
      setSelected(new Set());
    } catch (e) {
      setErr(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusyId(null);
      setBatchBusy(false);
    }
  }

  function tryLogin() {
    tokenRef.current = token.trim();
    setToken(token.trim());
    setLoading(true);
    setErr('');
    load().catch((e) => setErr(e instanceof Error ? e.message : '鉴权失败')).finally(() => setLoading(false));
  }

  async function runWaffoProbe() {
    if (!tokenRef.current) return;
    setProbeBusy(true);
    setProbeErr('');
    setProbe(null);
    try {
      const res = await fetch('/api/v1/admin/test-waffo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ amount: probeAmt.trim() || '9.99' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setProbe(data);
    } catch (e) {
      setProbeErr(e instanceof Error ? e.message : String(e));
    } finally {
      setProbeBusy(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  const stats = useMemo(() => {
    const total = items.length;
    const sel = selected.size;
    return { total, sel };
  }, [items, selected]);

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

  const tabs: StatusFilter[] = ['pending', 'approved', 'rejected', 'all'];

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--fg)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent)' }} aria-hidden />
          上架审核
        </div>
        <button
          onClick={() => load().catch((e) => setErr(e instanceof Error ? e.message : ''))}
          className="flex items-center gap-1.5 rounded-lg text-[13px]"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '7px 12px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} aria-hidden />
          刷新
        </button>
      </div>

      {/* Waffo 自检 */}
      <details
        className="mt-4 rounded-xl p-3"
        style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)' }}
      >
        <summary
          className="flex cursor-pointer items-center gap-2 text-[13px] font-medium"
          style={{ color: 'var(--fg)' }}
        >
          <Wrench size={14} style={{ color: 'var(--accent)' }} aria-hidden />
          工具 · Waffo 连通性自检
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[12px]" style={{ color: 'var(--muted)' }}>
              金额 (USD)
            </label>
            <input
              type="text"
              value={probeAmt}
              onChange={(e) => setProbeAmt(e.target.value)}
              placeholder="9.99"
              className="w-24 rounded-lg text-[13px] outline-none"
              style={{ ...field, padding: '6px 10px' }}
              aria-label="自检金额"
            />
            <button
              onClick={runWaffoProbe}
              disabled={probeBusy}
              className="flex items-center gap-1.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '7px 14px' }}
            >
              {probeBusy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Wrench size={13} aria-hidden />}
              运行诊断
            </button>
            {probeErr && (
              <span className="text-[12px]" style={{ color: 'var(--danger)' }}>
                {probeErr}
              </span>
            )}
          </div>
          {probe && (
            <pre
              className="overflow-auto rounded-lg p-3 text-[11.5px] leading-relaxed"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--fg-2)',
                maxHeight: '420px',
                fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
              }}
            >
              {JSON.stringify(probe, null, 2)}
            </pre>
          )}
        </div>
      </details>

      {/* 状态切换 */}
      <div className="mt-4 flex gap-1.5">
        {tabs.map((t) => {
          const active = status === t;
          return (
            <button
              key={t}
              onClick={() => setStatus(t)}
              className="rounded-lg text-[13px] font-medium"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface-warm)',
                color: active ? 'var(--accent-on)' : 'var(--fg-2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                padding: '6px 12px',
              }}
            >
              {STATUS_LABEL[t]}
            </button>
          );
        })}
      </div>

      {/* 搜索框 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="mt-3 flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--meta)' }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="按名称 / 域名搜索…"
            className="w-full rounded-lg pl-8 text-sm outline-none"
            style={{ ...field, paddingLeft: '32px' }}
            aria-label="搜索"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg text-[13px] font-medium"
          style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--border)', padding: '8px 14px' }}
        >
          搜索
        </button>
      </form>

      {err && (
        <p className="mt-3 text-[13px]" style={{ color: 'var(--danger)' }}>
          {err}
        </p>
      )}

      {/* 顶部统计 + 批量操作栏 */}
      <div className="mt-4 flex items-center justify-between text-[13px]" style={{ color: 'var(--muted)' }}>
        <div>
          共 <b style={{ color: 'var(--fg-2)' }}>{stats.total}</b> 条 · 已选{' '}
          <b style={{ color: 'var(--fg-2)' }}>{stats.sel}</b> 条
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => doAction([...selected], 'approve')}
              disabled={batchBusy}
              className="flex items-center gap-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '6px 12px' }}
            >
              <Check size={13} aria-hidden />
              批量通过 ({selected.size})
            </button>
            <button
              onClick={() => doAction([...selected], 'reject')}
              disabled={batchBusy}
              className="flex items-center gap-1.5 rounded-lg text-[12px] font-medium disabled:opacity-50"
              style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--danger)', padding: '6px 12px' }}
            >
              <X size={13} aria-hidden />
              批量拒绝 ({selected.size})
            </button>
          </div>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div
          className="mt-3 flex items-center justify-center gap-2 rounded-xl p-10 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <Loader2 size={15} className="animate-spin" aria-hidden />
          加载中…
        </div>
      ) : items.length === 0 ? (
        <div
          className="mt-3 flex items-center justify-center gap-2 rounded-xl p-10 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <Inbox size={15} aria-hidden />
          没有匹配的条目。
        </div>
      ) : (
        <>
          {/* 全选行 */}
          <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]" style={{ background: 'var(--surface-warm)', color: 'var(--muted)' }}>
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleSelectAll}
              aria-label="全选"
              style={{ accentColor: 'var(--accent)' }}
            />
            全选
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {items.map((it) => {
              const domain = (() => {
                try {
                  return new URL(it.url).hostname;
                } catch {
                  return it.url;
                }
              })();
              const checked = selected.has(it.id);
              return (
                <div
                  key={it.id}
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(it.id)}
                      aria-label={`选择 ${it.name}`}
                      className="mt-1.5 shrink-0"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div className="min-w-0 flex-1">
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
                        {it.status !== 'pending' && (
                          <span
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                            style={{
                              background: it.status === 'approved' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
                              color: it.status === 'approved' ? 'var(--success)' : 'var(--danger)',
                              border: `1px solid ${it.status === 'approved' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
                            }}
                          >
                            {STATUS_LABEL[it.status]}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[12px]" style={{ color: 'var(--meta)' }}>
                        {domain} · {it.category} · ${it.bidAmount.toFixed(2)}
                      </div>
                      {it.description && (
                        <div className="mt-1 truncate text-[13px]" style={{ color: 'var(--muted)' }}>
                          {it.description}
                        </div>
                      )}
                      {it.reviewReason && (
                        <div className="mt-1 truncate text-[12px]" style={{ color: 'var(--danger)' }}>
                          拒绝原因：{it.reviewReason}
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
                      onClick={() => doAction([it.id], 'approve')}
                      disabled={busyId === it.id || batchBusy}
                      className="flex items-center gap-1.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                      style={{ background: 'var(--accent)', color: 'var(--accent-on)', padding: '8px 16px' }}
                    >
                      <Check size={14} aria-hidden />
                      通过
                    </button>
                    <button
                      onClick={() => doAction([it.id], 'reject')}
                      disabled={busyId === it.id || batchBusy}
                      className="flex items-center gap-1.5 rounded-lg text-[13px] font-medium disabled:opacity-50"
                      style={{ background: 'var(--surface-warm)', color: 'var(--fg-2)', border: '1px solid var(--danger)', padding: '8px 16px' }}
                    >
                      <X size={14} aria-hidden />
                      拒绝
                    </button>
                    {(busyId === it.id || (batchBusy && selected.has(it.id))) && (
                      <Loader2 size={14} className="animate-spin self-center" style={{ color: 'var(--muted)' }} aria-hidden />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}