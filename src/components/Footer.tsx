import Link from 'next/link';
import { getServerLocale } from '@/lib/i18n/dict.server';
import { FOUNDER } from '@/lib/schema-org';

/**
 * 全站 Footer — Trust & E-E-A-T 信号：
 * 真实联系邮箱、运营者身份入口、版权与内容更新时间。
 */
export default async function Footer() {
  const locale = await getServerLocale();
  const zh = locale === 'zh';
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        marginTop: '48px',
        background: 'var(--surface)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '28px 16px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 20px',
            alignItems: 'center',
          }}
        >
          <Link href="/about" style={{ color: 'var(--fg-2)', fontSize: 13, textDecoration: 'none' }}>
            {zh ? '关于我们' : 'About'}
          </Link>
          <Link href="/rules" style={{ color: 'var(--fg-2)', fontSize: 13, textDecoration: 'none' }}>
            {zh ? '榜单规则' : 'Rules'}
          </Link>
          <Link href="/faq" style={{ color: 'var(--fg-2)', fontSize: 13, textDecoration: 'none' }}>
            {zh ? '常见问题' : 'FAQ'}
          </Link>
          <Link href="/categories" style={{ color: 'var(--fg-2)', fontSize: 13, textDecoration: 'none' }}>
            {zh ? '分类榜单' : 'Categories'}
          </Link>
          <Link href="/contact" style={{ color: 'var(--fg-2)', fontSize: 13, textDecoration: 'none' }}>
            {zh ? '联系我' : 'Contact'}
          </Link>
        </div>

        <p className="text-[12px]" style={{ color: 'var(--meta)', margin: 0 }}>
          {zh ? (
            <>
              ToolsRank · AI 工具竞价排行榜。运营者：{FOUNDER.name}（
              <a href={`mailto:${FOUNDER.email}`} style={{ color: 'var(--fg-2)' }}>
                {FOUNDER.email}
              </a>
              ）。榜单金额与出价记录每日公开可审计。
            </>
          ) : (
            <>
              ToolsRank · AI-tools bidding board. Operated by {FOUNDER.alternateName} (
              <a href={`mailto:${FOUNDER.email}`} style={{ color: 'var(--fg-2)' }}>
                {FOUNDER.email}
              </a>
              ). Bids and amounts are public and auditable daily.
            </>
          )}
        </p>

        <p className="text-[12px]" style={{ color: 'var(--meta)', margin: 0 }}>
          © {year} ToolsRank. {zh ? '保留所有权利。' : 'All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
