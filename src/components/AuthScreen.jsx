import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Compass, LogIn, UserPlus } from 'lucide-react';
import { formatAuthError, isSupabaseConfigured, supabase } from '../lib/supabase.js';

export default function AuthScreen() {
  const [modo, setModo] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setAviso('');
    if (!supabase) return;

    setEnviando(true);
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome: nome.trim() || 'Aventureiro' } },
        });
        if (error) throw error;
        if (!data.session) {
          setAviso('Conta criada! Verifique seu e-mail para confirmar (ou entre se a confirmação estiver desligada).');
        }
      }
    } catch (err) {
      setErro(formatAuthError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460, paddingTop: '3rem' }}>
      <div className="card stack">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Mesa</h1>
          <p className="muted" style={{ margin: 0 }}>
            História, fichas, pistas e tabuleiro ao vivo para a sua mesa de RPG.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <strong>Falta conectar o Supabase</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Crie um arquivo <code>.env</code> na pasta do projeto com{' '}
              <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>{' '}
              (copie de <code>.env.example</code>) e rode o <code>supabase_schema.sql</code> no
              SQL Editor do seu projeto Supabase.
            </p>
          </div>
        ) : (
          <>
            <div className="row">
              <button
                type="button"
                className={`btn btn-sm ${modo === 'login' ? 'btn-primary' : ''}`}
                onClick={() => {
                  setModo('login');
                  setErro('');
                }}
              >
                <LogIn size={15} /> Entrar
              </button>
              <button
                type="button"
                className={`btn btn-sm ${modo === 'cadastro' ? 'btn-primary' : ''}`}
                onClick={() => {
                  setModo('cadastro');
                  setErro('');
                }}
              >
                <UserPlus size={15} /> Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stack">
              {modo === 'cadastro' && (
                <div>
                  <label className="muted">Seu nome (como aparece na mesa)</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Jean"
                    required
                  />
                </div>
              )}

              <div>
                <label className="muted">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>

              <div>
                <label className="muted">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              {erro && (
                <div className="badge badge-accent" style={{ borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  {erro}
                </div>
              )}
              {aviso && (
                <div className="badge badge-success" style={{ borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  {aviso}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Aguarde...' : modo === 'login' ? 'Entrar na Mesa' : 'Criar conta'}
              </button>
            </form>
          </>
        )}

        <hr style={{ borderColor: 'var(--border)', width: '100%' }} />

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Link to="/biblioteca" className="btn btn-sm">
            <BookOpen size={15} /> Biblioteca de Livros
          </Link>
          <Link to="/guias/ordem-paranormal" className="btn btn-sm">
            <Compass size={15} /> Guias dos Sistemas
          </Link>
        </div>
      </div>
    </div>
  );
}
