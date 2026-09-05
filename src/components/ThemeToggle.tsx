'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'toolsrank-theme';

/**
 * 主题切换按钮。设计：
 * - 持久化在 localStorage（key: toolsrank-theme）
 * - 与 layout.tsx 内联脚本一致，避免 hydration mismatch
 * - SSR 首帧由 layout 决定，挂载后再渲染按钮（按钮的初始值取自运行时 DOM）
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const current = (root.getAttribute('data-theme') as Theme) ?? 'dark';
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage 不可用（如隐私模式）静默忽略
    }
  };

  // 未挂载前不渲染图标，避免 hydration 不一致
  const label = mounted
    ? theme === 'dark'
      ? '切换到浅色模式'
      : '切换到深色模式'
    : '切换主题';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2"
      style={{
        background: 'var(--surface-warm)',
        border: '1px solid var(--border)',
        color: 'var(--fg-2)',
      }}
    >
      {mounted ? (
        theme === 'dark' ? (
          <Sun size={15} aria-hidden />
        ) : (
          <Moon size={15} aria-hidden />
        )
      ) : (
        // 占位，保证 SSR 与客户端第一帧结构一致
        <Sun size={15} aria-hidden className="opacity-0" />
      )}
    </button>
  );
}
