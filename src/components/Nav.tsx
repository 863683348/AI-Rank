'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { href: '/', label: '榜单' },
  { href: '/categories', label: '分类' },
  { href: '/stats', label: '实时统计' },
  { href: '/rules', label: '规则' },
  { href: '/faq', label: '常见QA' },
  { href: '/contact', label: '联系我' },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'var(--fg)',
            flexShrink: 0,
          }}
        >
          <Trophy size={18} style={{ color: 'var(--accent)' }} aria-hidden />
          <span style={{ fontWeight: 600, fontSize: 15 }}>AI Rank</span>
        </Link>

        <nav
          style={{
            display: 'flex',
            gap: '4px',
            flex: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                style={{
                  textDecoration: 'none',
                  fontSize: 13,
                  padding: '6px 10px',
                  borderRadius: 8,
                  whiteSpace: 'nowrap',
                  color: active ? 'var(--accent-on)' : 'var(--muted)',
                  background: active ? 'var(--accent)' : 'transparent',
                  transition: 'background .15s, color .15s, transform .15s',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flexShrink: 0 }}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
