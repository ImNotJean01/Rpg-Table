import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function Config({ campanha, setCampanha, sistema, isMestre }) {
  const navigate = useNavigate();
  const [nome, setNome] = useState(campanha?.nome || '');
  const [membros, setMembros] = useState([]);
  const [copiado, setCopiado] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [atributosTxt, setAtributosTxt] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    if (!supabase || !campanha) return;
    supabase
      .from('membros')
      .select('user_id, papel, perfis(nome)')
      .eq('campanha_id', campanha.id)
      .then(({ data }) => {
        if (data) setMembros(data);
      });

    if (sistema.usaConfigDaCampanha) {
      setAtributosTxt(
        (sistema.atributos || []).map((a) => `${a.sigla}:${a.nome}`).join(', ')
      );
    }
  }, [campanha?.id]);

  if (!isMestre) {
    return (
      <div className="container">
        <div className="card muted">Apenas o mestre pode acessar as configurações da campanha.</div>
      </div>
    );
  }

  async function salvar(e) {
    e.preventDefault();
    if (!supabase) return;
    let config = campanha.config || {};
    if (sistema.usaConfigDaCampanha && atributosTxt.trim()) {
      const attrs = atributosTxt
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
          const [sigla, nomeAtr] = item.split(':').map((x) => x.trim());
          return {
            id: sigla.toLowerCase().replace(/[^a-z0-9]/g, ''),
            sigla: sigla.toUpperCase(),
            nome: nomeAtr || sigla,
          };
        });
      config = { ...config, atributos: attrs };
    }

    const { data, error } = await supabase
      .from('campanhas')
      .update({ nome: nome.trim(), config })
      .eq('id', campanha.id)
      .select()
      .single();
    if (!error && data) {
      setCampanha(data);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    }
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(campanha.codigo_convite);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  async function exportarBackup() {
    if (!supabase) return;
    setExportando(true);
    try {
      const [cap, pis, per, npc, cri, lnk, cen, pin] = await Promise.all([
        supabase.from('capitulos').select('*').eq('campanha_id', campanha.id),
        supabase.from('pistas').select('*').eq('campanha_id', campanha.id),
        supabase.from('personagens').select('*').eq('campanha_id', campanha.id),
        supabase.from('npcs').select('*').eq('campanha_id', campanha.id),
        supabase.from('criaturas').select('*').eq('campanha_id', campanha.id),
        supabase.from('links').select('*').eq('campanha_id', campanha.id),
        supabase.from('cenas').select('*').eq('campanha_id', campanha.id),
        supabase.from('pins').select('*').eq('campanha_id', campanha.id),
      ]);

      const backup = {
        exportado_em: new Date().toISOString(),
        campanha,
        capitulos: cap.data || [],
        pistas: pis.data || [],
        personagens: per.data || [],
        npcs: npc.data || [],
        criaturas: cri.data || [],
        links: lnk.data || [],
        cenas: cen.data || [],
        pins: pin.data || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${campanha.nome.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <h1 style={{ marginBottom: 0 }}>Configurações da Campanha</h1>

      <div className="card stack">
        <strong>Código de convite para os jogadores</strong>
        <div className="row">
          <code style={{ fontSize: '1.25rem', padding: '0.35rem 0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
            {campanha.codigo_convite}
          </code>
          <button type="button" className="btn btn-sm" onClick={copiarCodigo}>
            <Copy size={14} /> {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <form onSubmit={salvar} className="card stack">
        <div>
          <label className="muted">Nome da campanha</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        {sistema.usaConfigDaCampanha && (
          <div>
            <label className="muted">Atributos personalizados (formato: SIGLA:Nome, separados por vírgula)</label>
            <input
              value={atributosTxt}
              onChange={(e) => setAtributosTxt(e.target.value)}
              placeholder="FOR:Força, DES:Destreza, INT:Inteligência, CAR:Carisma"
            />
          </div>
        )}

        <div className="row">
          <button type="submit" className="btn btn-primary">
            <Save size={15} /> Salvar configurações
          </button>
          {salvo && <span className="badge badge-success">Salvo!</span>}
        </div>
      </form>

      <div className="card stack">
        <strong>Membros da mesa ({membros.length})</strong>
        <div className="stack" style={{ gap: '0.4rem' }}>
          {membros.map((m) => (
            <div key={m.user_id} className="space-between" style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', borderRadius: 8 }}>
              <span>{m.perfis?.nome || 'Jogador'}</span>
              <span className={`badge ${m.papel === 'mestre' ? 'badge-accent' : ''}`}>{m.papel}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card stack">
        <strong>Backup completo</strong>
        <p className="muted" style={{ margin: 0 }}>
          Baixe toda a história, fichas, NPCs, criaturas, pistas e mapas desta campanha em um arquivo <code>.json</code>.
        </p>
        <button
          type="button"
          className="btn"
          style={{ alignSelf: 'flex-start' }}
          onClick={exportarBackup}
          disabled={exportando}
        >
          <Download size={15} /> {exportando ? 'Exportando...' : 'Exportar Backup (.json)'}
        </button>
      </div>

      <div className="card stack" style={{ borderColor: 'rgba(224,49,49,0.45)' }}>
        <strong style={{ color: '#ff8787' }}>Zona de Perigo</strong>
        <p className="muted" style={{ margin: 0 }}>
          Apagar esta campanha remove permanentemente a história, fichas, NPCs, criaturas, pistas e mapas para todos os jogadores.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setConfirmarApagar(true)}
        >
          <Trash2 size={15} /> Apagar campanha
        </button>
      </div>

      <ConfirmModal
        aberto={confirmarApagar}
        titulo="Apagar campanha"
        mensagem={`Apagar permanentemente "${campanha.nome}"? Essa ação remove história, fichas, NPCs, criaturas, pistas e mapas e não tem volta.`}
        textoConfirmar="Sim, apagar campanha"
        carregando={apagando}
        onConfirmar={async () => {
          if (!supabase) return;
          setApagando(true);
          try {
            const { error } = await supabase.from('campanhas').delete().eq('id', campanha.id);
            if (!error) navigate('/');
          } finally {
            setApagando(false);
          }
        }}
        onCancelar={() => setConfirmarApagar(false)}
      />
    </div>
  );
}
