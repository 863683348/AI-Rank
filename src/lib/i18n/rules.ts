import type { Locale } from './dict';

/**
 * 榜单规则 — 双语
 */

export interface RuleItem {
  title: string;
  body: string;
}

export const RULES: Record<Locale, RuleItem[]> = {
  zh: [
    {
      title: '一、金额即排名',
      body: '榜单按「当前在榜金额」从高到低排序，金额越高越靠前。同额时，后出价者靠前。点击工具链接出站，每 IP 每天只计 1 次点击，防刷榜。',
    },
    {
      title: '二、每日重置机制',
      body: '北京时间每日 00:00，所有工具的「在榜金额」重置为 ¥1，名次归零重新竞价。工具条目本身、累计投入（lifetime）、点击数永久保留，不随重置消失。',
    },
    {
      title: '三、支付与上榜',
      body: '支持微信 / 支付宝扫码（一码付）。支付成功后由回调自动确认，金额累加进在榜金额并立即生效，榜单通过 SSE 实时刷新，无需手动刷新页面。',
    },
    {
      title: '四、公开可审计',
      body: '每一笔出价（金额、方式、时间）都公开记录在对应工具的出价表里，任何人可查。这是「显眼包」榜单的信任基础：花钱上的位，花得明明白白。',
    },
    {
      title: '五、去重与加价',
      body: '同一工具链接（URL）唯一，重复提交会提示「已在榜单，请直接加价」。加价即对现有条目追加在榜金额，名次随之上升。',
    },
    {
      title: '六、退款与争议',
      body: '支付成功后原则上不支持退款，因为上榜动作即时生效。如遇重复扣款等技术问题，凭订单号联系运营核对后处理。',
    },
  ],
  en: [
    {
      title: '1. Your bid is your rank',
      body: 'Ranking is purely by current on-board amount, highest first; on ties the later bid ranks ahead. Outbound clicks are capped at 1 per IP per day to block click-farming.',
    },
    {
      title: '2. Daily reset',
      body: 'At 00:00 Beijing time every day, every tool\'s on-board amount resets to ¥1 and ranks start over from zero. The tool entry itself, its lifetime spend, and click count are kept forever — only the rank resets.',
    },
    {
      title: '3. Payment and listing',
      body: 'WeChat Pay and Alipay both work via a single QR code. After payment, a callback confirms you, the amount is added to your on-board total, and the board refreshes in real time over SSE — no manual refresh needed.',
    },
    {
      title: '4. Public and auditable',
      body: 'Every bid (amount, method, time) is recorded on the corresponding tool\'s bid list and visible to anyone. That\'s the trust base of a spotlight board: pay to be seen, but pay visibly.',
    },
    {
      title: '5. Dedup and re-bidding',
      body: 'A tool URL is unique — re-submitting the same link prompts "Already on the board, please bid up." Bidding up adds to the existing entry and lifts rank immediately.',
    },
    {
      title: '6. Refunds and disputes',
      body: 'In principle we do not refund paid bids because ranking takes effect instantly. For technical issues such as double charges, contact support with the order ID for manual review.',
    },
  ],
};

export const RULES_META: Record<Locale, { title: string; description: string }> = {
  zh: {
    title: '榜单规则',
    description: 'ToolsRank 竞价榜规则：金额即排名、每日 00:00 重置、支付即可上榜、公开可审计。',
  },
  en: {
    title: 'Board Rules',
    description: 'ToolsRank bidding board rules: bid = rank, daily 00:00 reset, pay to list, public & auditable.',
  },
};
