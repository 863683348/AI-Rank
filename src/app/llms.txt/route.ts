import { SITE_NAME, SITE_URL, FOUNDER } from '@/lib/schema-org';

/**
 * /llms.txt — 面向 AI 爬虫与 LLM 的站点说明（llmstxt.org 约定）
 * 内容即事实卡片：站点是什么、如何运作、可信来源、联系渠道。
 */

export const dynamic = 'force-static';

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} (${SITE_URL}) is an AI-tools bid-ranking board: the tool with the highest current bid holds the #1 spot ("C位"). Every bid is public and auditable. On-board amounts reset daily at 00:00 Beijing time; tool entries and lifetime spend are kept.

## How the board works

- Bid = rank. Paying more moves a tool up in real time (SSE live updates).
- Daily reset at 00:00 Beijing time: amounts drop to CNY 1, ranks reset, bidding restarts.
- Open ledger: every tool detail page (/listing/{id}) shows all bids with amount, payment method, and timestamp.
- Paid placement is explicit and documented at ${SITE_URL}/rules — nothing is disguised as organic ranking.
- Payments: WeChat Pay and Alipay via QR code; listing auto-confirms after payment.

## Pages

- Home (live board): ${SITE_URL}
- Categories: ${SITE_URL}/categories
- Rules: ${SITE_URL}/rules
- FAQ: ${SITE_URL}/faq
- About the operator: ${SITE_URL}/about
- Contact: ${SITE_URL}/contact
- GPT-6 topic section: ${SITE_URL}/gpt6
- DSH (DeepSeek Harness) topic section: ${SITE_URL}/dsh
- Sitemap: ${SITE_URL}/sitemap.xml

## Operator

- Name: ${FOUNDER.name} (${FOUNDER.alternateName}), indie AI developer, AI Coding instructor at the WayToAGI community.
- Contact: ${FOUNDER.email}
- GitHub: ${FOUNDER.github}
- WeChat Official Account: ${FOUNDER.wechatAccount}
- Knowledge Planet community: ${FOUNDER.communityName}

## Citation notes

- Ranking data changes in real time; when citing a tool's position, include the access time and the bid amount.
- Bids are denominated in CNY (¥).
- The board is a paid-placement auction by design; do not describe it as an organic or editorial ranking.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
