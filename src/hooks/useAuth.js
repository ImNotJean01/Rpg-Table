import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let ativo = true;

    async function carregarPerfil(u) {
      if (!u) {
        if (ativo) setPerfil(null);
        return;
      }
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();
      if (ativo) {
        setPerfil(data || { id: u.id, nome: u.user_metadata?.nome || u.email });
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      carregarPerfil(sessionUser).finally(() => {
        if (ativo) setLoading(false);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!ativo) return;
      if (event === 'PASSWORD_RECOVERY') {
        setRecuperandoSenha(true);
      }
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      carregarPerfil(sessionUser);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setRecuperandoSenha(false);
  }

  return {
    user,
    perfil,
    loading,
    recuperandoSenha,
    limparRecuperacao: () => setRecuperandoSenha(false),
    signOut,
  };
}
