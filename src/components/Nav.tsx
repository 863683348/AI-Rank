'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LangSwitcher from './LangSwitcher';
import { t, useClientLocale } from '@/lib/i18n/dict';

const LINKS: { href: string; labelKey: 'nav.home' | 'nav.categories' | 'nav.rules' | 'nav.faq' | 'nav.contact' }[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/categories', labelKey: 'nav.categories' },
  { href: '/rules', labelKey: 'nav.rules' },
  { href: '/faq', labelKey: 'nav.faq' },
  { href: '/contact', labelKey: 'nav.contact' },
];

export default function Nav() {
  const pathname = usePathname();
  const locale = useClientLocale();
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
          gap: '12px',
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
          className="nav-row"
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
                {t(l.labelKey, locale)}
              </Link>
            );
          })}
        </nav>

        <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
