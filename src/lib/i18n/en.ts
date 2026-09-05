/**
 * i18n 字典 — 英文（占位）
 *
 * V1.0 阶段仅落地字典骨架与切换器（详见 layout.tsx + LangSwitcher），
 * 现有页面文案仍用中文。完整英文化推迟到 V1.1：
 * - 字典 key 必须与 zh.ts 对齐
 * - 缺失 key 返回 fallback 中文（兜底，不白屏）
 * - 占位英文仅用于 LangSwitcher 提示，不替换核心文案
 */

import type { DictKey } from './zh';

export const en: Partial<Record<DictKey, string>> = {
  'nav.home': 'Home',
  'nav.categories': 'Categories',
  'nav.rules': 'Rules',
  'nav.faq': 'FAQ',
  'nav.contact': 'Contact',
  'nav.about': 'About',
  'nav.admin': 'Admin',

  'home.title': 'C-Spot Spotlight',
  'home.subtitle': 'AI Tools Bidding Board — your bid is your rank, daily 00:00 reset',
  'home.latestBids': 'Latest bids',
  'home.bidsCount': 'bids',
  'home.noBids': 'No bids yet — grab the C-spot first.',
  'home.rules': 'Your bid is your rank — spend a little to grab the spotlight. Every payment is public & auditable. At 00:00 (Beijing time) daily all ranks reset to $1; entries & click counts are kept.',

  'status.approved': 'Approved',
  'status.pending': 'Pending',
  'status.rejected': 'Rejected',

  'time.justNow': 'just now',
  'time.minutesAgo': ' min ago',
  'time.hoursAgo': ' h ago',
  'time.daysAgo': ' d ago',

  'error.disabled': 'This channel is offline',
};