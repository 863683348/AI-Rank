import type { Locale } from './dict';

/**
 * 常见问题 — 双语
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: Record<Locale, FaqItem[]> = {
  zh: [
    {
      q: '这个榜单是干嘛的？',
      a: 'AI 工具竞价排行榜。谁愿意为「被看到」花更多钱，谁就排在更前面。本质是把「曝光位」明码标价，让好工具用真金白银证明自己值得被关注。',
    },
    {
      q: '花钱上榜算不算刷量？',
      a: '不算。榜单明确定义「金额即排名」，每一笔出价公开可查，不伪装成自然流量。它卖的是「显眼包」位置，不是虚假数据，规则对所有人都一样。',
    },
    {
      q: '每天重置是什么意思？',
      a: '北京时间 00:00，在榜金额清零回 ¥1、名次归零，大家重新竞价。但你的工具条目、累计投入和点击数会一直留着。相当于每天开一场新的「C 位拍卖」。',
    },
    {
      q: '支持哪些支付方式？',
      a: '微信和支付宝扫码都可以，同一个二维码两种 app 都能扫。支付成功自动确认、自动上榜，榜单实时刷新。',
    },
    {
      q: '我的工具已经上榜了，怎么再加价？',
      a: '在榜单里点该工具右侧的「竞价」按钮，输入加价金额支付即可，名次会立即上升。同一链接不能重复提交，只能加价。',
    },
    {
      q: '出价记录别人能看到吗？',
      a: '能。每个工具详情页都有出价表，金额、支付方式、时间全部公开。这是榜单信任机制的一部分。',
    },
    {
      q: '支付成功但没上榜怎么办？',
      a: '先等几秒让 SSE 推送，榜单会自动刷新。若长时间未更新，多半是回调未触达，凭订单号联系运营核对。',
    },
  ],
  en: [
    {
      q: 'What is this board for?',
      a: "It's an AI-tools bidding board. Whoever pays more for \"being seen\" ranks higher. We turn visibility slots into a priced auction — great tools prove themselves with real money, not fake metrics.",
    },
    {
      q: 'Is paying to rank considered fake traffic?',
      a: 'No. The board explicitly defines "your bid is your rank" and every payment is public — no faked organic traffic. It sells a spotlight slot under transparent rules that apply to everyone equally.',
    },
    {
      q: 'What does "daily reset" mean?',
      a: 'At 00:00 Beijing time, every on-board amount drops back to ¥1 and ranks reset to zero — everyone bids again from scratch. Your tool entry, lifetime spend, and click count are kept. Think of it as a daily C-spot auction.',
    },
    {
      q: 'Which payment methods are supported?',
      a: 'WeChat Pay and Alipay both work, via the same QR code. After payment, the listing is auto-confirmed and the board refreshes in real time.',
    },
    {
      q: 'My tool is already on the board — how do I raise the bid?',
      a: 'Click the "Bid" button on the right of your row, enter the increment, and pay. Rank rises immediately. The same URL can only be submitted once — you can only bid higher.',
    },
    {
      q: 'Can other people see my bid history?',
      a: 'Yes. Every tool detail page lists every bid with amount, payment method, and time. That public ledger is the trust mechanism behind the board.',
    },
    {
      q: 'I paid but my rank didn\'t update — what now?',
      a: 'Wait a few seconds for the SSE push to land; the board updates automatically. If it stays broken longer than that, the payment callback probably didn\'t reach us — contact support with your order ID.',
    },
  ],
};

export const FAQ_META: Record<Locale, { title: string; description: string }> = {
  zh: {
    title: '常见问题',
    description: '关于 ToolsRank 竞价榜、重置机制、支付与审计的常见问题。',
  },
  en: {
    title: 'FAQ',
    description: 'Common questions about the ToolsRank bidding board, daily reset, payment, and public audit.',
  },
};
