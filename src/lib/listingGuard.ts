/**
 * listingGuard.ts — 榜单真实性守卫
 *
 * 目标：杜绝非法/垃圾链接，借鉴 cc8.cc「从可信源拉取元数据」。因 ai-rank 是 AI 工具（多 Web SaaS），
 * 阶段1 用「硬校验 + 黑名单 + 内容安全」挡掉明显违规；阶段2 用「AI 工具域名白名单」自动放行，
 * 其余一律落人工审核（/admin）。人工审核是真正兜底的闸门。
 */

// 短链服务域名：可用来隐藏真实地址、绕过域名规则 → 拒绝
export const SHORTENERS = new Set([
  'bit.ly', 't.cn', 'tinyurl.com', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly',
  'rb.gy', 'cutt.ly', 'shorturl.at', 'rebrand.ly', 'soo.gd', 'u.nu', 'v.gd',
  'tiny.cc', 't.ly', '0x0.st', 's.id', 'lnk.to', 'surl.li', 'kutt.it',
]);

// 域名模糊关键词（命中即拒）—— 只放明显违规 token，避免误伤正常 AI 工具
export const BLOCKED_KEYWORDS = [
  'porn', 'adult', 'casino', 'gambling', 'escort', 'nude', '裸聊', '约炮',
  '赌博', '博彩', '彩票', '诈骗', '刷单', '跑分', '洗钱', '代孕', '枪支', '毒品', '水军',
];

// 内容安全词表（命中 name/description 即拒）—— 违规文案
export const SAFETY_KEYWORDS: { word: string; label: string }[] = [
  { word: '赌博', label: '赌博' },
  { word: '博彩', label: '赌博' },
  { word: '彩票', label: '赌博' },
  { word: '色情', label: '色情' },
  { word: '成人视频', label: '色情' },
  { word: '约炮', label: '色情' },
  { word: '裸聊', label: '色情' },
  { word: '诈骗', label: '诈骗' },
  { word: '刷单', label: '诈骗' },
  { word: '跑分', label: '诈骗' },
  { word: '洗钱', label: '诈骗' },
  { word: '代孕', label: '违规' },
  { word: '枪支', label: '违规' },
  { word: '毒品', label: '违规' },
  { word: '水军', label: '违规' },
];

// 已知可信 AI 工具域名（阶段2：命中自动放行，无需人工审核）
export const TRUSTED_DOMAINS = new Set([
  'openai.com', 'chatgpt.com', 'claude.ai', 'anthropic.com', 'anthropic.ai',
  'gemini.google.com', 'bard.google.com', 'copilot.microsoft.com', 'microsoft.com',
  'midjourney.com', 'cursor.com', 'runwayml.com', 'runway.com', 'perplexity.ai',
  'notion.so', 'notion.ai', 'canva.com', 'figma.com', 'synthesia.io',
  'elevenlabs.io', 'huggingface.co', 'replicate.com', 'stability.ai',
  'leonardo.ai', 'luma.ai', 'pika.art', 'klingai.com', 'kimi.moonshot.cn',
  'doubao.com', 'tongyi.aliyun.com', 'zhipuai.cn', 'baichuan-ai.com',
  'minimax.io', 'deepseek.com', 'qwen.ai', 'moonshot.cn', 'yiyan.baidu.com',
]);

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** 阶段1：URL 硬校验（https + 结构 + 短链拒 + 黑名单关键词） */
export function validateUrl(url: string): { ok: boolean; reason?: string } {
  const u = url.trim();
  if (!u) return { ok: false, reason: '链接不能为空' };
  if (!/^https:\/\//i.test(u)) return { ok: false, reason: '仅支持 https 链接' };
  let host = '';
  try {
    const parsed = new URL(u);
    host = parsed.hostname.toLowerCase();
    if (!host.includes('.') || host.startsWith('.') || host.startsWith('-')) {
      return { ok: false, reason: '链接格式不正确' };
    }
  } catch {
    return { ok: false, reason: '链接格式不正确' };
  }
  host = host.replace(/^www\./, '');
  if (SHORTENERS.has(host)) return { ok: false, reason: '不支持短链，请使用原始域名' };
  for (const kw of BLOCKED_KEYWORDS) {
    if (host.includes(kw)) return { ok: false, reason: '该域名不在允许范围' };
  }
  return { ok: true };
}

/** 阶段1：内容安全扫描（name/description） */
export function scanSafety(text: string): { ok: boolean; reason?: string } {
  if (!text) return { ok: true };
  for (const { word, label } of SAFETY_KEYWORDS) {
    if (text.includes(word)) return { ok: false, reason: `含违规内容（${label}）` };
  }
  return { ok: true };
}

/** 阶段2：域名是否命中可信白名单（支持子域名） */
export function isTrustedDomain(url: string): boolean {
  const host = domainOf(url);
  if (!host) return false;
  for (const d of TRUSTED_DOMAINS) {
    if (host === d || host.endsWith('.' + d)) return true;
  }
  return false;
}

/** 决定新条目初始状态：可信域名 → approved；否则 pending 待人工审核 */
export function decideStatus(url: string): { status: 'approved' | 'pending'; verified: boolean } {
  return isTrustedDomain(url)
    ? { status: 'approved', verified: true }
    : { status: 'pending', verified: false };
}
