export default function SkeletonCards({ quantidade = 3, altura = 140 }) {
  return (
    <div
      className="grid-cards"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando conteúdo"
    >
      {Array.from({ length: quantidade }).map((_, idx) => (
        <div
          key={idx}
          className="card skeleton-card stack"
          style={{ minHeight: altura, justifyContent: 'space-between' }}
        >
          <div className="stack" style={{ gap: '0.55rem' }}>
            <div className="space-between">
              <span className="skeleton-line" style={{ width: '36%', height: 18 }} />
              <span className="skeleton-line" style={{ width: '22%', height: 18 }} />
            </div>
            <span className="skeleton-line" style={{ width: '72%', height: 22 }} />
            <span className="skeleton-line" style={{ width: '90%', height: 14 }} />
          </div>
          <span className="skeleton-line" style={{ width: '48%', height: 14 }} />
        </div>
      ))}
    </div>
  );
}
