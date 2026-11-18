import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Compass, KeyRound, Plus, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { SISTEMAS } from '../sistemas/index.js';

const MODELO_SOBRE = `## Premissa
Descreva em poucas linhas qual é a missão e o clima da campanha.

## Tom e limites
O que funciona bem na mesa e o que prefere evitar.

## Regras da casa
Regras extras ou adaptações do grupo.

## Como criar seu personagem
NEX/nível inicial, restrições de origem/classe e dicas.

## Sessões
Dia, horário e onde vocês jogam (Discord, chamada, presencial).`;

export default function Campanhas({ user }) {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [sistema, setSistema] = useState('ordem-paranormal');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);

  async function carregar() {
    if (!supabase || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('membros')
      .select('papel, campanhas(*)')
      .eq('user_id', user.id);

    if (!error && data) {
      setLista(
        data
          .filter((d) => d.campanhas)
          .map((d) => ({ ...d.campanhas, papel: d.papel }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [user?.id]);

  async function criar(e) {
    e.preventDefault();
    if (!nome.trim() || !supabase) return;
    setErro('');
    setCriando(true);
    try {
      const { data, error } = await supabase.rpc('criar_campanha', {
        p_nome: nome.trim(),
        p_sistema: sistema,
        p_sobre: MODELO_SOBRE,
      });
      if (error) throw error;
      navigate(`/c/${data.id}`);
    } catch (err) {
      setErro(err.message || 'Erro ao criar campanha.');
    } finally {
      setCriando(false);
    }
  }

  async function entrar(e) {
    e.preventDefault();
    if (!codigo.trim() || !supabase) return;
    setErro('');
    try {
      const { data, error } = await supabase.rpc('entrar_campanha', {
        p_codigo: codigo.trim(),
      });
      if (error) throw error;
      navigate(`/c/${data.id}`);
    } catch (err) {
      setErro(err.message || 'Código inválido.');
    }
  }

  async function apagarCampanha(e, campanha) {
    e.preventDefault();
    e.stopPropagation();
    if (!supabase) return;
    if (!confirm(`Tem certeza que deseja apagar a mesa "${campanha.nome}"? Tudo (história, fichas, mapas) será perdido.`)) {
      return;
    }
    const { error } = await supabase.from('campanhas').delete().eq('id', campanha.id);
    if (error) {
      setErro(error.message || 'Não foi possível apagar a mesa.');
      return;
    }
    setLista((prev) => prev.filter((item) => item.id !== campanha.id));
  }

  return (
    <div className="container stack" style={{ gap: '1.5rem' }}>
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Minhas Campanhas</h1>
          <p className="muted" style={{ margin: 0 }}>
            Crie uma mesa como mestre ou entre com o código enviado por um amigo.
          </p>
        </div>
        <div className="row">
          <Link to="/biblioteca" className="btn btn-sm">
            <BookOpen size={15} /> Biblioteca
          </Link>
          <Link to="/guias/ordem-paranormal" className="btn btn-sm">
            <Compass size={15} /> Guias
          </Link>
        </div>
      </div>

      {erro && <div className="badge badge-accent" style={{ padding: '0.5rem 0.75rem' }}>{erro}</div>}

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
        <form onSubmit={criar} className="card stack">
          <strong>Criar nova campanha (você será o Mestre)</strong>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da campanha (ex: O Caso da Mansão)"
            required
          />
          <select value={sistema} onChange={(e) => setSistema(e.target.value)}>
            {Object.values(SISTEMAS).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {s.descricao}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={criando}>
            <Plus size={16} /> {criando ? 'Criando...' : 'Criar campanha'}
          </button>
        </form>

        <form onSubmit={entrar} className="card stack">
          <strong>Entrar em uma mesa existente</strong>
          <p className="muted" style={{ margin: 0 }}>
            Peça o código de convite (ex: <code>A1B-C2D</code>) para o mestre.
          </p>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de convite"
            required
          />
          <button type="submit" className="btn">
            <KeyRound size={16} /> Entrar como jogador
          </button>
        </form>
      </div>

      <div className="stack">
        <h2 style={{ marginBottom: 0 }}>Suas mesas</h2>
        {loading ? (
          <span className="muted">Carregando campanhas...</span>
        ) : lista.length === 0 ? (
          <div className="card muted">Você ainda não participa de nenhuma campanha.</div>
        ) : (
          <div className="grid-cards">
            {lista.map((c) => (
              <Link
                key={c.id}
                to={`/c/${c.id}`}
                className="card stack"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <div className="space-between">
                  <span className="badge">{SISTEMAS[c.sistema]?.nome || c.sistema}</span>
                  <span className={`badge ${c.papel === 'mestre' ? 'badge-accent' : ''}`}>
                    {c.papel === 'mestre' ? <><Shield size={12} /> Mestre</> : 'Jogador'}
                  </span>
                </div>
                <strong style={{ fontSize: '1.15rem' }}>{c.nome}</strong>
                {c.papel === 'mestre' && (
                  <div className="space-between" style={{ marginTop: '0.25rem' }}>
                    <span className="muted" style={{ fontSize: '0.82rem' }}>
                      Convite: <code>{c.codigo_convite}</code>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={(e) => apagarCampanha(e, c)}
                      title="Apagar mesa"
                    >
                      <Trash2 size={14} /> Apagar
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
