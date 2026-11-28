import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpenText,
  CheckCircle,
  CircleNotch,
  Compass,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Key,
  SignIn,
  UserPlus,
  WarningCircle,
} from '@phosphor-icons/react';
import { formatAuthError, isSupabaseConfigured, supabase } from '../lib/supabase.js';
import { cn } from '../lib/cn.js';
import { useRpgTheme } from '../context/ThemeContext.tsx';
import SeletorAtmosfera from './SeletorAtmosfera.jsx';

function avaliarForcaSenha(valor) {
  if (!valor) {
    return { nivel: 0, classe: '', texto: '' };
  }
  if (valor.length < 6) {
    const faltam = 6 - valor.length;
    return {
      nivel: 1,
      classe: 'active-weak',
      ok: false,
      texto: `Faltam ${faltam} caractere${faltam > 1 ? 's' : ''} (mínimo de 6)`,
    };
  }
  const temNumero = /\d/.test(valor);
  const temLetra = /[a-zA-Z]/.test(valor);
  const temEspecialOuLonga = /[^a-zA-Z0-9]/.test(valor) || valor.length >= 10;

  if (valor.length >= 8 && temNumero && temLetra && temEspecialOuLonga) {
    return {
      nivel: 3,
      classe: 'active-strong',
      ok: true,
      texto: 'Senha forte · ótima proteção para a sua conta',
    };
  }
  return {
    nivel: 2,
    classe: 'active-medium',
    ok: true,
    texto: 'Senha válida · adicione números ou 8+ caracteres para deixá-la forte',
  };
}

export default function AuthScreen() {
  const { guiaPath, nomeSistema } = useRpgTheme();
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro' | 'esqueci' | 'magic'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [erroCodigo, setErroCodigo] = useState(''); // 'ja_cadastrado' | 'credenciais' | ''
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const redirectUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined;

  function trocarModo(novo) {
    setModo(novo);
    setErro('');
    setErroCodigo('');
    setAviso('');
  }

  const forcaSenha = avaliarForcaSenha(senha);
  const confirmacaoDigitada = modo === 'cadastro' && confirmarSenha.length > 0;
  const senhasCoincidem = senha.length >= 6 && senha === confirmarSenha;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setErroCodigo('');
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
          throw new Error('As duas senhas não coincidem. Verifique a confirmação.');
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
          setAviso(
            'Conta criada! Verifique seu e-mail para confirmar (ou clique em Entrar se a confirmação já estiver liberada).'
          );
        }
      } else if (modo === 'esqueci') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        setAviso(
          'Enviamos um link para o seu e-mail para redefinir a senha. Confira também a caixa de spam.'
        );
      } else if (modo === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        setAviso(
          'Enviamos um link de acesso direto para o seu e-mail! Basta clicar nele para entrar.'
        );
      }
    } catch (err) {
      const raw = String(err?.message || err || '');
      if (raw.includes('User already registered') || raw.includes('already been registered')) {
        setErroCodigo('ja_cadastrado');
        setErro('Esse e-mail já tem conta na Mesa.');
      } else if (raw.includes('Invalid login credentials')) {
        setErroCodigo('credenciais');
        setErro('E-mail ou senha incorretos.');
      } else {
        setErro(formatAuthError(err));
      }
    } finally {
      setEnviando(false);
    }
  }

  const abas = [
    { id: 'login', label: 'Entrar', icone: SignIn },
    { id: 'cadastro', label: 'Criar conta', icone: UserPlus },
    { id: 'magic', label: 'Link', icone: EnvelopeSimple, title: 'Entrar com link no e-mail sem precisar de senha' },
  ];

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: '3.25rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="card dossie-papel stack"
      >
        <div className="space-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem' }}>Mesa</h1>
            <p className="muted" style={{ margin: 0 }}>
              História, fichas, pistas e tabuleiro ao vivo para a sua campanha.
            </p>
          </div>
          <SeletorAtmosfera />
        </div>

        <hr className="hairline" />

        {!isSupabaseConfigured ? (
          <div className="card" style={{ background: 'var(--bg-elevated)' }}>
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
            <div className="auth-tabs" role="tablist" aria-label="Modo de acesso">
              {abas.map((aba) => {
                const Icone = aba.icone;
                const ativo = modo === aba.id || (modo === 'esqueci' && aba.id === 'login');
                return (
                  <button
                    key={aba.id}
                    type="button"
                    role="tab"
                    aria-selected={ativo}
                    className={cn('auth-tab-btn', ativo && 'ativo')}
                    onClick={() => trocarModo(aba.id)}
                    title={aba.title}
                  >
                    {ativo && (
                      <motion.span
                        layoutId="auth-mode-pill"
                        className="auth-tab-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <Icone size={14} weight="duotone" />
                    <span>{aba.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              <AnimatePresence initial={false}>
                {modo === 'cadastro' && (
                  <motion.div
                    key="campo-nome"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label htmlFor="auth-nome">Seu nome (como aparece na mesa)</label>
                    <input
                      id="auth-nome"
                      name="name"
                      autoComplete="name"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Jean"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="auth-email">E-mail</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>

              {(modo === 'login' || modo === 'cadastro') && (
                <div>
                  <label htmlFor="auth-senha">Senha</label>
                  <div className="input-with-icon has-right">
                    <input
                      id="auth-senha"
                      name="password"
                      type={mostrarSenha ? 'text' : 'password'}
                      autoComplete={modo === 'cadastro' ? 'new-password' : 'current-password'}
                      className={cn(
                        modo === 'cadastro' &&
                          senha.length > 0 &&
                          (forcaSenha.ok ? 'input-status-ok' : 'input-status-warn')
                      )}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setMostrarSenha((v) => !v)}
                      title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {mostrarSenha ? (
                        <EyeSlash size={16} weight="light" />
                      ) : (
                        <Eye size={16} weight="light" />
                      )}
                    </button>
                  </div>

                  {modo === 'cadastro' && senha.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16 }}
                    >
                      <div className="password-meter" aria-hidden="true">
                        {[1, 2, 3].map((idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'password-meter-bar',
                              forcaSenha.nivel >= idx && forcaSenha.classe
                            )}
                          />
                        ))}
                      </div>
                      <div className={cn('field-hint', forcaSenha.ok ? 'ok' : 'warn')}>
                        {forcaSenha.ok ? (
                          <CheckCircle size={14} weight="fill" />
                        ) : (
                          <WarningCircle size={14} weight="fill" />
                        )}
                        <span>{forcaSenha.texto}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {modo === 'cadastro' && (
                <div>
                  <label htmlFor="auth-confirmar-senha">Confirmar senha</label>
                  <input
                    id="auth-confirmar-senha"
                    name="confirmPassword"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn(
                      confirmacaoDigitada &&
                        (senhasCoincidem ? 'input-status-ok' : 'input-status-warn')
                    )}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha escolhida"
                    required
                    minLength={6}
                  />
                  {confirmacaoDigitada && (
                    <div className={cn('field-hint', senhasCoincidem ? 'ok' : 'warn')}>
                      {senhasCoincidem ? (
                        <>
                          <CheckCircle size={14} weight="fill" />
                          <span>As senhas coincidem</span>
                        </>
                      ) : (
                        <>
                          <WarningCircle size={14} weight="fill" />
                          <span>As duas senhas ainda não coincidem</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {erro && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="badge badge-accent"
                  style={{
                    borderRadius: 8,
                    padding: '0.6rem 0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    whiteSpace: 'normal',
                    lineHeight: 1.4,
                  }}
                >
                  <span>{erro}</span>
                  {erroCodigo === 'ja_cadastrado' && (
                    <div className="row" style={{ gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => trocarModo('login')}
                      >
                        Entrar com esse e-mail
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => trocarModo('esqueci')}
                      >
                        Recuperar senha
                      </button>
                    </div>
                  )}
                  {erroCodigo === 'credenciais' && (
                    <div className="row" style={{ gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => trocarModo('esqueci')}
                      >
                        Esqueci minha senha
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => trocarModo('magic')}
                      >
                        Entrar com link no e-mail
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {aviso && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="badge badge-success"
                  style={{
                    borderRadius: 8,
                    padding: '0.6rem 0.78rem',
                    whiteSpace: 'normal',
                    lineHeight: 1.4,
                  }}
                >
                  {aviso}
                </motion.div>
              )}

              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando && <CircleNotch size={16} weight="bold" className="spin-icon" />}
                <span>
                  {enviando
                    ? modo === 'login'
                      ? 'Entrando na Mesa...'
                      : modo === 'cadastro'
                      ? 'Criando sua conta...'
                      : 'Enviando link para o e-mail...'
                    : modo === 'login'
                    ? 'Entrar na Mesa'
                    : modo === 'cadastro'
                    ? 'Criar minha conta'
                    : modo === 'esqueci'
                    ? 'Enviar link de recuperação'
                    : 'Enviar link de acesso no e-mail'}
                </span>
              </button>

              {modo === 'login' && (
                <div className="space-between" style={{ fontSize: '0.81rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => trocarModo('esqueci')}
                    style={{ paddingLeft: 0 }}
                  >
                    <Key size={14} weight="light" /> Esqueci minha senha
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => trocarModo('cadastro')}
                    style={{ paddingRight: 0 }}
                  >
                    Não tem conta? <strong style={{ color: 'var(--accent-primary)' }}>Criar agora</strong>
                  </button>
                </div>
              )}

              {modo === 'cadastro' && (
                <div className="row" style={{ justifyContent: 'center', fontSize: '0.81rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => trocarModo('login')}
                  >
                    Já tem conta? <strong style={{ color: 'var(--accent-primary)' }}>Entrar na Mesa</strong>
                  </button>
                </div>
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

        <hr className="hairline" />

        <div className="auth-footer-links">
          <Link to="/biblioteca" className="btn btn-sm">
            <BookOpenText size={15} weight="duotone" aria-hidden="true" /> Biblioteca
          </Link>
          <Link
            to={guiaPath}
            className="btn btn-sm"
            title={`Abrir guia de regras de ${nomeSistema}`}
          >
            <Compass size={15} weight="duotone" aria-hidden="true" /> Guia ({nomeSistema.split(' ')[0]})
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
