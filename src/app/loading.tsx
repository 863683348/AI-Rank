export default function Loading() {
  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        display: 'grid',
        gap: '12px',
      }}
    >
      <div
        style={{
          height: 56,
          borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: 96,
          borderRadius: 12,
          background: 'var(--surface-warm)',
          border: '1px solid var(--border)',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 72,
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: .55 } 50% { opacity: .9 } }`}</style>
    </main>
  );
}