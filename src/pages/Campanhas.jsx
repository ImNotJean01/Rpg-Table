import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpenText,
  CheckCircle,
  Compass,
  Fingerprint,
  Flame,
  Key,
  Plus,
  Shield,
  Sword,
  Trash,
} from '@phosphor-icons/react';

const ICONE_SISTEMA = {
  'ordem-paranormal': Fingerprint,
  dnd5e: Sword,
  tormenta20: Flame,
  generico: Compass,
};
import { supabase } from '../lib/supabase.js';
import { SISTEMAS } from '../sistemas/index.js';
import { cn } from '../lib/cn.js';
import { useRpgTheme } from '../context/ThemeContext.tsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

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
  const { syncFromSystem } = useRpgTheme();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [sistema, setSistema] = useState('ordem-paranormal');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);
  const [campanhaParaApagar, setCampanhaParaApagar] = useState(null);
  const [apagando, setApagando] = useState(false);

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

  function pedirApagarCampanha(e, campanha) {
    e.preventDefault();
    e.stopPropagation();
    setCampanhaParaApagar(campanha);
  }

  async function confirmarApagarCampanha() {
    if (!supabase || !campanhaParaApagar) return;
    setApagando(true);
    try {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', campanhaParaApagar.id);
      if (error) {
        setErro(error.message || 'Não foi possível apagar a mesa.');
        return;
      }
      setLista((prev) => prev.filter((item) => item.id !== campanhaParaApagar.id));
      setCampanhaParaApagar(null);
    } finally {
      setApagando(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="container stack"
      style={{ gap: '1.75rem' }}
    >
      <div className="space-between" style={{ alignItems: 'flex-end' }}>
        <div>
          <span className="section-kicker">Salão de Crônicas</span>
          <h1 style={{ margin: '0.2rem 0 0.25rem' }}>Minhas Campanhas</h1>
          <p className="muted" style={{ margin: 0 }}>
            Inicie uma nova mesa como mestre ou junte-se a uma crônica com o código de convite.
          </p>
        </div>
        <div className="row">
          <Link to="/biblioteca" className="btn btn-sm">
            <BookOpenText size={15} weight="duotone" /> Biblioteca
          </Link>
          <Link to="/guias/ordem-paranormal" className="btn btn-sm">
            <Compass size={15} weight="duotone" /> Guias
          </Link>
        </div>
      </div>

      {erro && <div className="badge badge-accent" style={{ padding: '0.5rem 0.75rem' }}>{erro}</div>}

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <form onSubmit={criar} className="card dossie-papel stack" style={{ padding: '1.35rem' }}>
          <div>
            <span className="section-kicker">Mestre</span>
            <h3 style={{ margin: '0.2rem 0 0' }}>Criar nova campanha</h3>
          </div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da campanha (ex: O Caso da Mansão)"
            required
          />
          <div>
            <label className="muted">Sistema da campanha</label>
            <div className="sistema-picker" role="radiogroup" aria-label="Sistema da campanha">
              {Object.values(SISTEMAS).map((s) => {
                const Icon = ICONE_SISTEMA[s.id] || Compass;
                const ativo = sistema === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    className={cn('sistema-option', ativo && 'selecionado')}
                    onClick={() => {
                      setSistema(s.id);
                      syncFromSystem(s.tema);
                    }}
                  >
                    <div className="sistema-option-head">
                      <span className="sistema-option-titulo">
                        <Icon size={15} weight={ativo ? 'duotone' : 'light'} />
                        {s.nome}
                      </span>
                      {ativo && (
                        <CheckCircle size={15} weight="duotone" color="var(--accent-primary)" />
                      )}
                    </div>
                    <span className="sistema-option-desc">{s.descricao}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={criando}>
            <Plus size={16} weight="duotone" /> {criando ? 'Criando...' : 'Criar campanha'}
          </button>
        </form>

        <form onSubmit={entrar} className="card stack" style={{ padding: '1.35rem', justifyContent: 'space-between' }}>
          <div className="stack" style={{ gap: '0.45rem' }}>
            <div>
              <span className="section-kicker">Jogador</span>
              <h3 style={{ margin: '0.2rem 0 0' }}>Entrar em uma mesa</h3>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Digite o código de convite (ex: <code>A1B-C2D</code>) enviado pelo mestre.
            </p>
          </div>
          <div className="stack" style={{ gap: '0.65rem' }}>
            <input
              className="mono"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código de convite"
              required
            />
            <button type="submit" className="btn">
              <Key size={16} weight="duotone" /> Entrar como jogador
            </button>
          </div>
        </form>
      </div>

      <hr className="hairline" />

      <div className="stack">
        <div className="space-between">
          <h2 style={{ marginBottom: 0 }}>Suas mesas</h2>
          <span className="muted mono" style={{ fontSize: '0.8rem' }}>
            {lista.length} {lista.length === 1 ? 'crônica' : 'crônicas'}
          </span>
        </div>

        {loading ? (
          <span className="muted">Carregando campanhas...</span>
        ) : lista.length === 0 ? (
          <div className="card dossie-papel muted">Você ainda não participa de nenhuma campanha.</div>
        ) : (
          <div className="grid-cards">
            {lista.map((c) => (
              <motion.div
                key={c.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
              >
                <Link
                  to={`/c/${c.id}`}
                  className="card card-interactive stack"
                  style={{ color: 'inherit', textDecoration: 'none', height: '100%', justifyContent: 'space-between' }}
                >
                  <div className="stack" style={{ gap: '0.55rem' }}>
                    <div className="space-between">
                      <span className="badge">{SISTEMAS[c.sistema]?.nome || c.sistema}</span>
                      <span className={cn('badge', c.papel === 'mestre' && 'badge-accent')}>
                        {c.papel === 'mestre' ? (
                          <>
                            <Shield size={12} weight="duotone" /> Mestre
                          </>
                        ) : (
                          'Jogador'
                        )}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{c.nome}</h3>
                  </div>

                  {c.papel === 'mestre' && (
                    <div className="space-between" style={{ marginTop: '0.5rem', paddingTop: '0.55rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="muted" style={{ fontSize: '0.78rem' }}>
                        Convite: <code>{c.codigo_convite}</code>
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={(e) => pedirApagarCampanha(e, c)}
                        title="Apagar mesa"
                      >
                        <Trash size={14} weight="light" /> Apagar
                      </button>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        aberto={Boolean(campanhaParaApagar)}
        titulo="Apagar mesa"
        mensagem={`Tem certeza que deseja apagar "${campanhaParaApagar?.nome}"? Toda a história, fichas, NPCs, pistas e mapas serão perdidos permanentemente.`}
        textoConfirmar="Sim, apagar mesa"
        carregando={apagando}
        onConfirmar={confirmarApagarCampanha}
        onCancelar={() => setCampanhaParaApagar(null)}
      />
    </motion.div>
  );
}
