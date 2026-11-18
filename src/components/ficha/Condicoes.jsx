export default function Condicoes({ opcoes = [], ativas = [], podeEditar, onChange }) {
  if (!opcoes.length) return null;

  function toggle(cond) {
    if (!podeEditar) return;
    const existe = ativas.includes(cond);
    const prox = existe ? ativas.filter((c) => c !== cond) : [...ativas, cond];
    onChange(prox);
  }

  return (
    <div className="stack" style={{ gap: '0.35rem' }}>
      <span className="muted" style={{ fontSize: '0.82rem' }}>Condições / Status</span>
      <div className="row" style={{ gap: '0.35rem' }}>
        {opcoes.map((cond) => {
          const ativa = ativas.includes(cond);
          return (
            <button
              key={cond}
              type="button"
              disabled={!podeEditar}
              onClick={() => toggle(cond)}
              className={`badge ${ativa ? 'badge-warn' : ''}`}
              style={{
                cursor: podeEditar ? 'pointer' : 'default',
                padding: '0.25rem 0.6rem',
                opacity: !podeEditar && !ativa ? 0.55 : 1,
              }}
            >
              {cond}
            </button>
          );
        })}
      </div>
    </div>
  );
}
