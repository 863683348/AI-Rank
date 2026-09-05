/**
 * 邮件通知（管理端提醒）：新条目进入 pending 时通知审核人
 *
 * 配置：
 *   RESEND_API_KEY     — Resend 控制台拿，https://resend.com/api-keys
 *   ADMIN_NOTIFY_EMAIL — 收件人邮箱（如 863683348@qq.com）
 *   NOTIFY_FROM        — 可选，发件人地址（需在 Resend 验证过的域名），默认 Resend 沙箱 `onboarding@resend.dev`
 *
 * 失败不影响主流程：仅 console.warn。
 */

type NotifyPayload = {
  listingId: string;
  name: string;
  url: string;
  category?: string;
};

const RESEND_API = 'https://api.resend.com/emails';

export async function notifyNewPending(p: NotifyPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    // 未配置 → 静默跳过（开发态常见）
    return;
  }
  const from = process.env.NOTIFY_FROM || 'AI-Rank <onboarding@resend.dev>';

  const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ai-rank-sigma.vercel.app'}/admin`;
  const subject = `[AI-Rank] 新提交待审核：${p.name}`;
  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.6;color:#111">
      <p>有新的工具提交，进入待审核队列：</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px;color:#666">名称</td><td style="padding:4px 12px"><b>${escapeHtml(p.name)}</b></td></tr>
        <tr><td style="padding:4px 12px;color:#666">链接</td><td style="padding:4px 12px"><a href="${escapeAttr(p.url)}">${escapeHtml(p.url)}</a></td></tr>
        ${p.category ? `<tr><td style="padding:4px 12px;color:#666">分类</td><td style="padding:4px 12px">${escapeHtml(p.category)}</td></tr>` : ''}
      </table>
      <p>
        <a href="${reviewUrl}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">前往审核台</a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:24px">listingId: ${escapeHtml(p.listingId)}</p>
    </div>
  `;
  const text = `新提交待审核\n\n名称：${p.name}\n链接：${p.url}\n${p.category ? `分类：${p.category}\n` : ''}\n审核台：${reviewUrl}\n\nlistingId: ${p.listingId}`;

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[notify] resend ${res.status}: ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.warn('[notify] failed:', e instanceof Error ? e.message : e);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}