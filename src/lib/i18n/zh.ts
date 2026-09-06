/**
 * i18n 字典 — 中文
 *
 * MVP 阶段用最轻量方案：
 * - 文案集中到本文件，方便后续 V1.1 启用完整双语
 * - 现有页面仍可硬编码中文（保持运行不变）
 * - 新增文案必须走 key，便于 V1.1 一键替换
 *
 * 使用：
 *   import { t } from '@/lib/i18n/dict';
 *   const text = t('home.title', 'zh');
 */

export const zh = {
  // 导航
  'nav.home': '首页',
  'nav.categories': '分类榜单',
  'nav.stats': '实时统计',
  'nav.rules': '榜单规则',
  'nav.faq': '常见问题',
  'nav.contact': '联系我',
  'nav.about': '关于',
  'nav.admin': '审核后台',

  // 首页
  'home.title': 'C 位的显眼包',
  'home.subtitle': 'AI 工具竞价排行榜 — 金额即名次，每日 00:00 重置',
  'home.cta.submit': '提交新工具',
  'home.cta.bid': '加价',
  'home.cta.visit': '访问',
  'home.latestBids': '最新出价',
  'home.bidsCount': '笔',
  'home.noBids': '还没有出价，抢先占 C 位。',
  'home.rules': '金额即排名，花小钱上 C 位、当显眼包；每一笔公开可审计。每日 00:00（北京时间）在榜金额重置为 $1，条目与点击数保留。',

  // 状态
  'status.approved': '已上榜',
  'status.pending': '审核中',
  'status.rejected': '已拒绝',
  'status.verified': '可信源',

  // 时间
  'time.justNow': '刚刚',
  'time.minutesAgo': '分钟前',
  'time.hoursAgo': '小时前',
  'time.daysAgo': '天前',

  // 错误
  'error.urlInvalid': '链接必须是 https:// 开头',
  'error.urlShortener': '不支持短链，请使用原始域名',
  'error.urlBlocked': '该域名不在允许范围',
  'error.nameTooLong': '名称不超过 60 字',
  'error.amountRange': '竞价金额范围 1 - 100000',
  'error.contentSafety': '含违规内容',
  'error.network': '网络错误，请重试',
  'error.disabled': '该通道已下线',
};

export type DictKey = keyof typeof zh;