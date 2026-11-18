import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseKey) &&
  !supabaseUrl.includes('seu-projeto') &&
  !supabaseKey.includes('sua-chave');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function formatAuthError(error) {
  if (!error) return '';
  const msg = String(error.message || error);
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered') || msg.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Clique em "Entrar", "Link no e-mail" ou "Esqueci minha senha" em vez de criar outra conta.';
  }
  if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (msg.includes('Invalid email')) return 'Digite um e-mail válido.';
  return msg;
}
