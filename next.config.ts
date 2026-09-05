import type { NextConfig } from 'next';

const securityHeaders = [
  // MIME 嗅探保护
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 点击劫持
  { key: 'X-Frame-Options', value: 'DENY' },
  // referrer 控制
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // HSTS（含子域，预加载）
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // 权限策略：禁用摄像头/麦克风/地理位置/FLoC
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // 内容安全策略
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // script: self + GA4 / Clarity（Theme 防闪烁脚本需要 unsafe-inline；MVP 暂保留）
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
      "style-src 'self' 'unsafe-inline'",
      // img: self + data: + 任意 https（详情页 favicon + YunGouOS 二维码）
      "img-src 'self' data: https:",
      // connect: GA4 / Clarity / YunGouOS API / Waffo API / Neon
      "connect-src 'self' https://www.google-analytics.com https://*.clarity.ms https://api.pay.yungouos.com https://api.waffo.ai https://*.neon.tech",
      // frame: 不被嵌；支付预览自身来源
      "frame-src 'self' https://*.pay.yungouos.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://api.pay.yungouos.com https://api.waffo.ai",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;