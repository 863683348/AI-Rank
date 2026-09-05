import type { Metadata } from 'next';

const FAQ = [
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
];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '常见问题',
  description: '关于 ToolsRank 竞价榜、重置机制、支付与审计的常见问题。',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          常见问题
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          关于竞价、重置、支付与审计，你大概想问的都在这里。
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FAQ.map((f, i) => (
          <details
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <summary
              className="text-[14px] font-medium"
              style={{ cursor: 'pointer', color: 'var(--fg)', listStyle: 'none' }}
            >
              {f.q}
            </summary>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              {f.a}
            </p>
          </details>
        ))}
      </section>
    </main>
  );
}
