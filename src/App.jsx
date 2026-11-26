import { useEffect, useRef, useState } from 'react';
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpenText,
  CaretDoubleLeft,
  CaretDoubleRight,
  Compass,
  Fingerprint,
  GearSix,
  List,
  MapTrifold,
  Scroll,
  Shield,
  SignOut,
  Skull,
  UserCircle,
  Users,
  X,
} from '@phosphor-icons/react';
import { useAuth } from './hooks/useAuth.js';
import { useCampanha } from './hooks/useCampanha.js';
import { supabase } from './lib/supabase.js';
import { cn } from './lib/cn.js';
import { useRpgTheme } from './context/ThemeContext.tsx';
import AuthScreen from './components/AuthScreen.jsx';
import SeletorAtmosfera from './components/SeletorAtmosfera.jsx';
import Campanhas from './pages/Campanhas.jsx';
import Sobre from './pages/Sobre.jsx';
import Guia from './pages/Guia.jsx';
import Historia from './pages/Historia.jsx';
import Pistas from './pages/Pistas.jsx';
import Personagens from './pages/Personagens.jsx';
import Npcs from './pages/Npcs.jsx';
import Criaturas from './pages/Criaturas.jsx';
import Tabuleiro from './pages/Tabuleiro.jsx';
import Biblioteca from './pages/Biblioteca.jsx';
import Config from './pages/Config.jsx';

function CampanhaShell({ user, perfil, onSignOut }) {
  const { id } = useParams();
  const location = useLocation();
  const { syncFromSystem } = useRpgTheme();
  const { campanha, setCampanha, isMestre, sistema, loading, erro } = useCampanha(
    id,
    user.id
  );

  useEffect(() => {
    if (sistema?.tema) {
      syncFromSystem(sistema.tema);
    }
  }, [sistema?.tema, syncFromSystem]);
  const [pistaNova, setPistaNova] = useState(null);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [sidebarRecolhida, setSidebarRecolhida] = useState(() => {
    try {
      return window.localStorage.getItem('mesa-sidebar-recolhida') === '1';
    } catch {
      return false;
    }
  });
  const timerRef = useRef(null);

  useEffect(() => {
    setMenuMobileAberto(false);
  }, [location.pathname]);

  function alternarSidebarRecolhida() {
    setSidebarRecolhida((prev) => {
      const proximo = !prev;
      try {
        window.localStorage.setItem('mesa-sidebar-recolhida', proximo ? '1' : '0');
      } catch {
        // Ignora caso localStorage esteja indisponível
      }
      return proximo;
    });
  }

  useEffect(() => {
    if (!supabase || !id) return;
    const ch = supabase
      .channel(`pista-toast:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pistas',
          filter: `campanha_id=eq.${id}`,
        },
        (payload) => {
          const nova = payload.new;
          if (nova?.visivel && (!payload.old || !payload.old.visivel)) {
            setPistaNova(nova);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setPistaNova(null), 8000);
          }
        }
      )
      .subscribe();
    return () => {
      clearTimeout(timerRef.current);
      supabase.removeChannel(ch);
    };
  }, [id]);

  if (loading) {
    return <div className="container muted">Carregando crônica...</div>;
  }
  if (erro || !campanha) {
    return (
      <div className="container stack">
        <div className="card">
          <strong>Campanha não encontrada ou sem acesso.</strong>
          <p className="muted">{erro}</p>
          <Link to="/" className="btn btn-sm">Voltar para Minhas Campanhas</Link>
        </div>
      </div>
    );
  }

  const base = `/c/${id}`;
  const abas = [
    { to: base, label: 'Sobre', Icon: Compass, end: true },
    { to: `${base}/historia`, label: 'História', Icon: Scroll },
    { to: `${base}/pistas`, label: 'Pistas', Icon: Fingerprint },
    { to: `${base}/personagens`, label: 'Personagens', Icon: Users },
    { to: `${base}/npcs`, label: 'NPCs', Icon: UserCircle },
    { to: `${base}/criaturas`, label: 'Criaturas', Icon: Skull },
    { to: `${base}/mesa`, label: 'Tabuleiro', Icon: MapTrifold },
    { to: `${base}/guia`, label: 'Guia', Icon: BookOpenText },
    { to: `${base}/biblioteca`, label: 'Biblioteca', Icon: BookOpenText },
    ...(isMestre ? [{ to: `${base}/config`, label: 'Config', Icon: GearSix }] : []),
  ];

  const abaAtiva =
    abas.find(({ to, end }) =>
      end
        ? location.pathname === to || location.pathname === `${to}/`
        : location.pathname.startsWith(to)
    ) || abas[0];

  return (
    <div>
      <header className="topbar">
        <div className="row">
          <button
            type="button"
            className="btn btn-sm campanha-nav-toggle-mobile"
            onClick={() => setMenuMobileAberto((v) => !v)}
            aria-label="Abrir menu da campanha"
          >
            <List size={16} weight="bold" />
            <span>{abaAtiva.label}</span>
          </button>
          <Link to="/" className="btn btn-sm btn-ghost">
            <ArrowLeft size={15} weight="light" /> Mesas
          </Link>
          <span className="topbar-brand">{campanha.nome}</span>
          <span className="badge">{sistema.nome}</span>
          <span className={cn('badge', isMestre && 'badge-accent')}>
            {isMestre ? (
              <>
                <Shield size={12} weight="duotone" /> Mestre
              </>
            ) : (
              'Jogador'
            )}
          </span>
        </div>

        <div className="row">
          <span className="muted">{perfil?.nome}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onSignOut}>
            <SignOut size={15} weight="light" /> Sair
          </button>
        </div>
      </header>

      <div className="campanha-shell">
        {menuMobileAberto && (
          <div
            className="campanha-nav-backdrop"
            onClick={() => setMenuMobileAberto(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={cn(
            'campanha-nav',
            sidebarRecolhida && 'recolhida',
            menuMobileAberto && 'aberta-mobile'
          )}
          aria-label="Menu da campanha"
        >
          <div className="campanha-nav-lista">
            <div className="campanha-nav-header-mobile">
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                {campanha.nome}
              </strong>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setMenuMobileAberto(false)}
                aria-label="Fechar menu"
              >
                <X size={16} weight="light" />
              </button>
            </div>

            {abas.map(({ to, label, Icon, end }) => {
              const ativa = end
                ? location.pathname === to || location.pathname === `${to}/`
                : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn('nav-tab', ativa && 'active')}
                  title={sidebarRecolhida ? label : undefined}
                  onClick={() => setMenuMobileAberto(false)}
                >
                  {ativa && (
                    <motion.span
                      layoutId="nav-tab-active"
                      className="nav-tab-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={17} weight={ativa ? 'duotone' : 'light'} />
                  <span className="nav-tab-label">{label}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            className="campanha-nav-collapse-btn"
            onClick={alternarSidebarRecolhida}
            title={sidebarRecolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={sidebarRecolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {sidebarRecolhida ? (
              <CaretDoubleRight size={15} weight="bold" />
            ) : (
              <CaretDoubleLeft size={15} weight="bold" />
            )}
          </button>
        </aside>

        <main className="campanha-main">
          <Routes>
            <Route
              index
              element={<Sobre campanha={campanha} setCampanha={setCampanha} isMestre={isMestre} />}
            />
            <Route path="historia" element={<Historia campanhaId={id} isMestre={isMestre} />} />
            <Route path="pistas" element={<Pistas campanhaId={id} isMestre={isMestre} />} />
            <Route
              path="personagens"
              element={
                <Personagens
                  campanhaId={id}
                  sistema={sistema}
                  userId={user.id}
                  isMestre={isMestre}
                />
              }
            />
            <Route path="npcs" element={<Npcs campanhaId={id} isMestre={isMestre} />} />
            <Route
              path="criaturas"
              element={<Criaturas campanhaId={id} sistema={sistema} isMestre={isMestre} />}
            />
            <Route
              path="mesa"
              element={
                <Tabuleiro
                  campanhaId={id}
                  sistema={sistema}
                  userId={user.id}
                  autorNome={perfil?.nome || 'Jogador'}
                  isMestre={isMestre}
                />
              }
            />
            <Route path="guia" element={<Guia sistemaAtual={sistema} />} />
            <Route
              path="biblioteca"
              element={<Biblioteca campanhaId={id} sistema={sistema} isMestre={isMestre} />}
            />
            <Route
              path="config"
              element={
                <Config
                  campanha={campanha}
                  setCampanha={setCampanha}
                  sistema={sistema}
                  isMestre={isMestre}
                />
              }
            />
          </Routes>
        </main>
      </div>

      <AnimatePresence>
        {pistaNova && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="toast-pista stack"
            style={{ gap: '0.45rem' }}
          >
            <div className="space-between">
              <strong className="row" style={{ gap: '0.4rem' }}>
                <Fingerprint size={16} weight="duotone" /> Nova pista revelada
              </strong>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setPistaNova(null)}
              >
                <X size={14} weight="light" />
              </button>
            </div>
            <div>{pistaNova.titulo}</div>
            <Link
              to={`${base}/pistas`}
              className="btn btn-sm btn-primary"
              onClick={() => setPistaNova(null)}
            >
              Abrir no Mural de Pistas
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NovaSenhaScreen({ onConcluir }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmar) {
      setErro('As duas senhas não coincidem.');
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      onConcluir();
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: '3.5rem' }}>
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={salvar}
        className="card dossie-papel stack"
      >
        <span className="section-kicker">Recuperação de Acesso</span>
        <h2 style={{ margin: 0 }}>Definir nova senha</h2>
        <p className="muted" style={{ margin: 0 }}>
          Digite sua nova senha abaixo para continuar na Mesa.
        </p>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Nova senha (mín. 6 caracteres)"
          minLength={6}
          required
        />
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Confirmar nova senha"
          minLength={6}
          required
        />
        {erro && <div className="badge badge-accent">{erro}</div>}
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </motion.form>
    </div>
  );
}

export default function App() {
  const { user, perfil, loading, recuperandoSenha, limparRecuperacao, signOut } = useAuth();

  if (loading) {
    return <div className="container muted">Iniciando Mesa...</div>;
  }

  if (user && recuperandoSenha) {
    return <NovaSenhaScreen onConcluir={limparRecuperacao} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/guias/:guiaId" element={<Guia />} />
        <Route path="/guias" element={<Navigate to="/guias/ordem-paranormal" replace />} />

        {!user ? (
          <Route path="*" element={<AuthScreen />} />
        ) : (
          <>
            <Route
              path="/"
              element={
                <>
                  <header className="topbar">
                    <span className="topbar-brand">
                      <Scroll size={19} weight="duotone" /> Mesa
                    </span>
                    <div className="row">
                      <SeletorAtmosfera />
                      <span className="muted">{perfil?.nome}</span>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={signOut}>
                        <SignOut size={15} weight="light" /> Sair
                      </button>
                    </div>
                  </header>
                  <Campanhas user={user} />
                </>
              }
            />
            <Route
              path="/c/:id/*"
              element={<CampanhaShell user={user} perfil={perfil} onSignOut={signOut} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
}
