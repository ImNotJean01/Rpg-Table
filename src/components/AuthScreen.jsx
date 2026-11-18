import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Compass, Eye, EyeOff, KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { formatAuthError, isSupabaseConfigured, supabase } from '../lib/supabase.js';

export default function AuthScreen() {
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro' | 'esqueci' | 'magic'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const redirectUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined;

  function trocarModo(novo) {
    setModo(novo);
    setErro('');
    setAviso('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setAviso('');
    if (!supabase) return;

    setEnviando(true);
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
      } else if (modo === 'cadastro') {
        if (senha !== confirmarSenha) {
          throw new Error('As duas senhas não coincidem.');
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: { nome: nome.trim() || 'Aventureiro' },
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAviso('Conta criada! Verifique seu e-mail para confirmar (ou tente entrar se a confirmação estiver desligada).');
        }
      } else if (modo === 'esqueci') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        setAviso('Enviamos um link para o seu e-mail para redefinir a senha. Confira também a caixa de spam.');
      } else if (modo === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        setAviso('Enviamos um link de acesso direto para o seu e-mail! Basta clicar nele para entrar.');
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
            <div className="row" style={{ gap: '0.35rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${modo === 'login' ? 'btn-primary' : ''}`}
                onClick={() => trocarModo('login')}
              >
                <LogIn size={14} /> Entrar
              </button>
              <button
                type="button"
                className={`btn btn-sm ${modo === 'cadastro' ? 'btn-primary' : ''}`}
                onClick={() => trocarModo('cadastro')}
              >
                <UserPlus size={14} /> Criar conta
              </button>
              <button
                type="button"
                className={`btn btn-sm ${modo === 'magic' ? 'btn-primary' : ''}`}
                onClick={() => trocarModo('magic')}
                title="Entrar com link no e-mail sem precisar de senha"
              >
                <Mail size={14} /> Link no e-mail
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

              {(modo === 'login' || modo === 'cadastro') && (
                <div>
                  <label className="muted">Senha</label>
                  <div className="row" style={{ gap: '0.35rem' }}>
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setMostrarSenha((v) => !v)}
                      title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {modo === 'cadastro' && (
                <div>
                  <label className="muted">Confirmar senha</label>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    minLength={6}
                  />
                </div>
              )}

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
                {enviando
                  ? 'Aguarde...'
                  : modo === 'login'
                  ? 'Entrar na Mesa'
                  : modo === 'cadastro'
                  ? 'Criar conta'
                  : modo === 'esqueci'
                  ? 'Enviar link de recuperação'
                  : 'Enviar link de acesso no e-mail'}
              </button>

              {modo === 'login' && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => trocarModo('esqueci')}
                  style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
                >
                  <KeyRound size={14} /> Esqueci minha senha
                </button>
              )}
              {modo === 'esqueci' && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => trocarModo('login')}
                  style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
                >
                  ← Voltar para o login
                </button>
              )}
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
