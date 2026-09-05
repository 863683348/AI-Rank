/**
 * schema.org JSON-LD 构建器 — 全站统一出口
 *
 * 目标：Structured Data / Trust & E-E-A-T / Citability
 * - Organization + Person(founder) + sameAs：建立站点与真实运营者的实体关联
 * - WebSite：站点级实体，供各页面 @graph 复用
 * - FAQPage / ItemList / BreadcrumbList：按页面注入
 *
 * 所有 builder 返回纯对象，页面侧用 <script type="application/ld+json"> 注入。
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://toolsrank.lol';

export const SITE_NAME = 'ToolsRank';

export const FOUNDER = {
  name: '大飞象',
  alternateName: 'Dafeixiang',
  email: '863683348@qq.com',
  github: 'https://github.com/863683348',
  wechatAccount: '大飞象的智能体2025',
  communityName: '大飞象AI陪你成长',
  description:
    'AI 独立开发者，WayToAGI 社区 AI Coding 讲师。独立开发并运营 ToolsRank、Codex Pet Generator 等多个 AI 产品。',
};

/** Organization + founder Person + WebSite — 每个页面都注入 */
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        email: `mailto:${FOUNDER.email}`,
        description: 'AI 工具竞价排行榜：金额即排名，每一笔透明可审计。',
        founder: {
          '@type': 'Person',
          '@id': `${SITE_URL}/#founder`,
          name: FOUNDER.name,
          alternateName: FOUNDER.alternateName,
          email: FOUNDER.email,
          url: `${SITE_URL}/about`,
          description: FOUNDER.description,
          knowsAbout: ['AI 工具', 'AI 编程', '独立开发'],
          sameAs: [FOUNDER.github],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: 'AI Rank',
        description: 'AI 工具竞价排行榜：金额即排名，每日 00:00 重置。',
        inLanguage: 'zh-CN',
        publisher: { '@id': `${SITE_URL}/#org` },
      },
    ],
  };
}

/** FAQPage — /faq 页注入 */
export function faqPageJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/faq#faq`,
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** BreadcrumbList — 静态子页面注入 */
export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
      ...crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: c.name,
        item: `${SITE_URL}${c.path}`,
      })),
    ],
  };
}

/** ItemList — 榜单页注入（工具条目，可被 AI 引用） */
export function itemListJsonLd(
  rows: { name: string; url: string; description?: string | null; bidAmount: string | number }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#board`,
    name: 'AI 工具竞价排行榜',
    description: '按当前竞价金额降序排列的 AI 工具榜单，每日 00:00（北京时间）重置。',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 20).map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: r.name,
        url: r.url,
        description: r.description ?? `${r.name} — 当前竞价 ¥${r.bidAmount}`,
        applicationCategory: 'AIApplication',
        offers: {
          '@type': 'Offer',
          price: r.bidAmount,
          priceCurrency: 'CNY',
        },
      },
    })),
  };
}
