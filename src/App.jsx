import { useEffect, useRef, useState } from 'react';
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import {
  BookOpen,
  Compass,
  FileSearch,
  LogOut,
  Map,
  ScrollText,
  Settings,
  Shield,
  Skull,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth.js';
import { useCampanha } from './hooks/useCampanha.js';
import { supabase } from './lib/supabase.js';
import AuthScreen from './components/AuthScreen.jsx';
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
  const { campanha, setCampanha, isMestre, sistema, loading, erro } = useCampanha(
    id,
    user.id
  );
  const [pistaNova, setPistaNova] = useState(null);
  const timerRef = useRef(null);

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
    return <div className="container muted">Carregando campanha...</div>;
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

  return (
    <div>
      <header className="topbar">
        <div className="row">
          <Link to="/" className="btn btn-sm">← Mesas</Link>
          <span className="topbar-brand">{campanha.nome}</span>
          <span className="badge">{sistema.nome}</span>
          <span className={`badge ${isMestre ? 'badge-accent' : ''}`}>
            {isMestre ? <><Shield size={12} /> Mestre</> : 'Jogador'}
          </span>
        </div>

        <div className="row">
          <span className="muted">{perfil?.nome}</span>
          <button type="button" className="btn btn-sm" onClick={onSignOut}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <NavLink to={`${base}`} end className="nav-tab">
          <Compass size={15} /> Sobre
        </NavLink>
        <NavLink to={`${base}/historia`} className="nav-tab">
          <ScrollText size={15} /> História
        </NavLink>
        <NavLink to={`${base}/pistas`} className="nav-tab">
          <FileSearch size={15} /> Pistas
        </NavLink>
        <NavLink to={`${base}/personagens`} className="nav-tab">
          <Users size={15} /> Personagens
        </NavLink>
        <NavLink to={`${base}/npcs`} className="nav-tab">
          <UserCheck size={15} /> NPCs
        </NavLink>
        <NavLink to={`${base}/criaturas`} className="nav-tab">
          <Skull size={15} /> Criaturas
        </NavLink>
        <NavLink to={`${base}/mesa`} className="nav-tab">
          <Map size={15} /> Tabuleiro
        </NavLink>
        <NavLink to={`${base}/guia`} className="nav-tab">
          <Compass size={15} /> Guia do Livro
        </NavLink>
        <NavLink to={`${base}/biblioteca`} className="nav-tab">
          <BookOpen size={15} /> Biblioteca
        </NavLink>
        {isMestre && (
          <NavLink to={`${base}/config`} className="nav-tab">
            <Settings size={15} /> Config
          </NavLink>
        )}
      </nav>

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
            <Personagens campanhaId={id} sistema={sistema} userId={user.id} isMestre={isMestre} />
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

      {pistaNova && (
        <div className="toast-pista stack" style={{ gap: '0.4rem' }}>
          <div className="space-between">
            <strong>🔍 Nova pista revelada!</strong>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPistaNova(null)}>
              ✕
            </button>
          </div>
          <div>{pistaNova.titulo}</div>
          <Link to={`${base}/pistas`} className="btn btn-sm btn-primary" onClick={() => setPistaNova(null)}>
            Ver no Mural de Pistas
          </Link>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, perfil, loading, signOut } = useAuth();

  if (loading) {
    return <div className="container muted">Iniciando Mesa...</div>;
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
                    <span className="topbar-brand">Mesa — RPG</span>
                    <div className="row">
                      <span className="muted">{perfil?.nome}</span>
                      <button type="button" className="btn btn-sm" onClick={signOut}>
                        <LogOut size={14} /> Sair
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
