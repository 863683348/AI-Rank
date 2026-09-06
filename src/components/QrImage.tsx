'use client';

import { useState } from 'react';

/**
 * QrImage — 收款码图片（多扩展名兜底）
 *
 * public/qr/ 下的收款码可能为 .jpg / .png / .jpeg / .webp，
 * 且本地与 Vercel 部署可能不一致。用 onError 依次尝试扩展名，
 * 全部失败后显示纯色占位（不破图不塌版）。
 */
const QR_EXTS = ['jpg', 'png', 'jpeg', 'webp'] as const;

export default function QrImage({ base, alt }: { base: string; alt: string }) {
  const [tries, setTries] = useState(0);
  const src = `/${base}.${QR_EXTS[tries % QR_EXTS.length]}`;
  const exhausted = tries >= QR_EXTS.length;

  if (exhausted) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--meta)',
          fontSize: 12,
          background: 'var(--surface-warm)',
        }}
      >
        收款码待上传
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setTries((i) => i + 1)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
