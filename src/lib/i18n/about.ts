import type { Locale } from './dict';

/**
 * 关于页 — 双语
 * E-E-A-T：向搜索引擎和 AI 爬虫声明站点的真实运营者、方法与可信来源。
 */

export const ABOUT_META: Record<Locale, { title: string; description: string }> = {
  zh: {
    title: '关于 ToolsRank',
    description:
      'ToolsRank 是一个 AI 工具竞价排行榜。了解我们是谁、榜单如何运作、为什么每一笔出价都公开可审计。',
  },
  en: {
    title: 'About ToolsRank',
    description:
      'ToolsRank is an AI-tools bidding board. Learn who runs it, how ranking works, and why every bid is public and auditable.',
  },
};

export const ABOUT: Record<
  Locale,
  {
    h1: string;
    intro: string;
    whoTitle: string;
    whoBody: string[];
    howTitle: string;
    howItems: string[];
    trustTitle: string;
    trustItems: string[];
    factLabel: string;
    facts: { label: string; value: string }[];
    donateTitle: string;
    donateBody: string;
    donateWechatLabel: string;
    donateAlipayLabel: string;
    donateFootnote: string;
    donateImgAlt: { wechat: string; alipay: string };
  }
> = {
  zh: {
    h1: '关于 ToolsRank',
    intro:
      'ToolsRank 是一个 AI 工具竞价排行榜：金额即排名，花小钱上 C 位。我们不做伪装成自然排名的推荐位——每一笔出价公开、可审计，规则对所有人一致。',
    whoTitle: '我们是谁',
    whoBody: [
      'ToolsRank 由大飞象（Dafeixiang）独立开发并运营。他是 AI 独立开发者、WayToAGI 社区 AI Coding 讲师，长期撰写 AI 工具评测与独立开发实践，运营微信公众号「大飞象的智能体2025」与知识星球「大飞象AI陪你成长」。',
      '这个站点解决一个具体问题：AI 工具太多、曝光位太少，而「编辑推荐」既不透明也不可验证。ToolsRank 把曝光位明码标价，让市场自己排序。',
    ],
    howTitle: '榜单如何运作',
    howItems: [
      '出价即排名：某工具当前累计竞价金额最高，它就排第一。',
      '每日重置：北京时间 00:00，在榜金额清零回 ¥1、名次归零，条目与累计投入保留。',
      '全公开账本：每个工具详情页展示全部出价记录，含金额、支付方式、时间。',
      '支付即生效：微信 / 支付宝扫码，支付成功自动确认上榜，榜单通过 SSE 实时刷新。',
    ],
    trustTitle: '为什么可以信任这份榜单',
    trustItems: [
      '不刷量：我们不伪装成自然流量，「付费曝光」写在明面上，规则页可查。',
      '可审计：出价记录永久公开，任何人对账无需联系客服。',
      '可联系：商务与合作直接发邮件 ahmedlzany423@gmail.com，人在回复。',
      '来源可查：运营者身份、GitHub 仓库、社交账号全部实名公开（见下方名片）。',
    ],
    factLabel: '站点档案',
    facts: [
      { label: '上线时间', value: '2026 年' },
      { label: '运营者', value: '大飞象（Dafeixiang）' },
      { label: '联系邮箱', value: 'ahmedlzany423@gmail.com' },
      { label: '内容更新', value: '榜单实时更新；规则与 FAQ 按需修订' },
    ],
    donateTitle: '☕ 请作者喝杯咖啡',
    donateBody:
      '如果你觉得 ToolsRank 对你有用，欢迎请作者喝杯咖啡。扫码赞助完全自愿，不附条件、不解锁额外功能，仅作为对独立维护的支持。',
    donateWechatLabel: '微信支付',
    donateAlipayLabel: '支付宝',
    donateFootnote:
      '图位占位：把图片上传到 public/qr/wechat-pay.png 与 public/qr/alipay-pay.png 即可显示。',
    donateImgAlt: { wechat: '微信支付二维码', alipay: '支付宝收款二维码' },
  },
  en: {
    h1: 'About ToolsRank',
    intro:
      'ToolsRank is an AI-tools bidding board: your bid is your rank. We do not dress paid placements up as organic rankings — every bid is public, auditable, and governed by rules that apply to everyone.',
    whoTitle: 'Who we are',
    whoBody: [
      'ToolsRank is built and operated by Dafeixiang (大飞象), an indie AI developer and AI Coding instructor at the WayToAGI community. He publishes AI-tool reviews and indie-development notes on his WeChat Official Account 「大飞象的智能体2025」 and his Knowledge Planet community 「大飞象AI陪你成长」.',
      'The site solves one concrete problem: too many AI tools, too few visibility slots, and "editor picks" that are neither transparent nor verifiable. ToolsRank prices those slots openly and lets the market sort itself.',
    ],
    howTitle: 'How the board works',
    howItems: [
      'Bid = rank: the tool with the highest current total bid holds position #1.',
      'Daily reset: at 00:00 Beijing time, on-board amounts drop to ¥1 and ranks reset; entries and lifetime spend are kept.',
      'Open ledger: every tool detail page shows all bids with amount, payment method, and time.',
      'Instant effect: WeChat / Alipay QR payment auto-confirms; the board refreshes in real time via SSE.',
    ],
    trustTitle: 'Why you can trust this board',
    trustItems: [
      'No fake traffic: paid placement is stated plainly on the Rules page — nothing disguised as organic.',
      'Auditable: bid records are permanently public; anyone can reconcile them without contacting support.',
      'Reachable: business inquiries go to ahmedlzany423@gmail.com and are answered by a human.',
      'Verifiable identity: operator identity, GitHub repos, and social accounts are all public (see the profile card below).',
    ],
    factLabel: 'Site facts',
    facts: [
      { label: 'Launched', value: '2026' },
      { label: 'Operator', value: 'Dafeixiang (大飞象)' },
      { label: 'Contact', value: 'ahmedlzany423@gmail.com' },
      { label: 'Content updates', value: 'Board updates in real time; rules and FAQ revised as needed' },
    ],
    donateTitle: '☕ Buy me a coffee',
    donateBody:
      'If ToolsRank saves you time finding the right AI tools, consider buying me a coffee. Donations are completely voluntary, unlock no extra features, and exist solely to support independent maintenance.',
    donateWechatLabel: 'WeChat Pay',
    donateAlipayLabel: 'Alipay',
    donateFootnote:
      'QR placeholders: drop your images at public/qr/wechat-pay.png and public/qr/alipay-pay.png to render here.',
    donateImgAlt: { wechat: 'WeChat Pay QR code', alipay: 'Alipay QR code' },
  },
};
