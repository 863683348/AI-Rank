import type { Metadata } from 'next';

const RULES = [
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
];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '榜单规则',
  description: 'ToolsRank 竞价榜规则：金额即排名、每日 00:00 重置、支付即可上榜、公开可审计。',
  alternates: { canonical: '/rules' },
};

export default function RulesPage() {
  return (
    <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          榜单规则
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          花小钱上 C 位，规则透明、结果可审计。
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {RULES.map((r) => (
          <div
            key={r.title}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <h2 className="text-[15px] font-medium" style={{ color: 'var(--accent)' }}>
              {r.title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              {r.body}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
