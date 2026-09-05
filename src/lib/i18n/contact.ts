import type { Locale } from './dict';

/**
 * 联系方式 — 双语
 */

export interface ContactItem {
  label: string;
  value: string;
  href: string | null;
  ctaLabel: string | null;
}

export const CONTACTS: Record<Locale, ContactItem[]> = {
  zh: [
    {
      label: '商务 / 合作邮箱',
      value: 'ahmedlzany423@gmail.com',
      href: 'mailto:ahmedlzany423@gmail.com',
      ctaLabel: '发邮件',
    },
    {
      label: '微信公众号',
      value: '大飞象的智能体2025',
      href: null,
      ctaLabel: '站内搜索关注',
    },
    {
      label: '知识星球',
      value: '大飞象AI陪你成长',
      href: null,
      ctaLabel: '站内搜索关注',
    },
  ],
  en: [
    {
      label: 'Business / partnerships',
      value: 'ahmedlzany423@gmail.com',
      href: 'mailto:ahmedlzany423@gmail.com',
      ctaLabel: 'Send email',
    },
    {
      label: 'WeChat Official Account',
      value: '大飞象的智能体2025',
      href: null,
      ctaLabel: 'Search in WeChat',
    },
    {
      label: 'Knowledge Star (知识星球)',
      value: '大飞象AI陪你成长',
      href: null,
      ctaLabel: 'Search inside the app',
    },
  ],
};

export const CONTACT_META: Record<Locale, { title: string; description: string; subtitle: string }> = {
  zh: {
    title: '联系我',
    description: 'ToolsRank 商务合作、上架咨询、退款核对的联系方式。',
    subtitle: '合作、上架咨询、退款核对，都可以通过下面任一方式找到我。',
  },
  en: {
    title: 'Contact',
    description: 'ToolsRank business, listing, and refund contact channels.',
    subtitle: 'For partnerships, listing inquiries, or refund checks, reach me through any of the channels below.',
  },
};

export const CONTACT_CTA_TITLE: Record<Locale, string> = {
  zh: '想进 C 位？',
  en: 'Ready to grab the C-spot?',
};

// 给前端拼接：{CTALink} 是占位，会被替换为 <Link> 节点
export const CONTACT_CTA_BODY: Record<Locale, string> = {
  zh: '直接去 {link} 点「提交新工具」，$1 起竞价，支付完立即生效。',
  en: 'Head to the {link}, click "Submit a tool", bid from $1, and you\'re live the moment payment clears.',
};

export const CONTACT_CTA_LINK: Record<Locale, string> = {
  zh: '榜单首页',
  en: 'home page',
};
