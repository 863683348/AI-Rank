/**
 * 服务端 favicon 代理 — 解决国内访客直连 google s2 / 目标站 favicon 被墙裂图的问题。
 * 用法：/api/v1/favicon?d=midjourney.com
 * 链路：目标站 /favicon.ico → Google s2 → 404（客户端再落到首字母色块）
 * 缓存：浏览器 1 天 + CDN 7 天，favicon 变更最多滞后一周，可接受。
 */

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

function pickImage(buf: ArrayBuffer, ct: string): Response | null {
  // 过滤掉空文件 / HTML 错误页（有些站点 favicon 404 返回 200 + HTML）
  if (!ct.startsWith('image/') && !ct.includes('icon')) return null;
  if (buf.byteLength < 100 || buf.byteLength > 2_000_000) return null;
  return new Response(buf, {
    headers: {
      'content-type': ct,
      'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}

async function tryFetch(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ToolsRankBot/1.0)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') ?? '').toLowerCase();
    const buf = await res.arrayBuffer();
    return pickImage(buf, ct);
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  const raw = new URL(req.url).searchParams.get('d')?.toLowerCase().trim() ?? '';

  // SSRF 防护：只放行公网域名形态，拒绝 IP/localhost/内网/端口/路径
  if (!raw || !HOST_RE.test(raw) || raw === 'localhost' || raw.endsWith('.local') || raw.endsWith('.internal')) {
    return new Response(null, { status: 400 });
  }

  // 1. 目标站自己的 favicon（清晰度通常最好）
  const direct = await tryFetch(`https://${raw}/favicon.ico`);
  if (direct) return direct;

  // 2. Google s2（服务端在海外，不受访客网络影响）
  const s2 = await tryFetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(raw)}&sz=128`);
  if (s2) return s2;

  return new Response(null, { status: 404 });
}
