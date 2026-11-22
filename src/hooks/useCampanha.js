import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { resolverSistema } from '../sistemas/index.js';

export function useCampanha(campanhaId, userId) {
  const [campanha, setCampanha] = useState(null);
  const [papel, setPapel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!supabase || !campanhaId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);

    try {
      const [{ data: camp, error: errCamp }, { data: mem, error: errMem }] =
        await Promise.all([
          supabase.from('campanhas').select('*').eq('id', campanhaId).single(),
          supabase
            .from('membros')
            .select('papel')
            .eq('campanha_id', campanhaId)
            .eq('user_id', userId)
            .single(),
        ]);

      if (errCamp) throw errCamp;
      if (errMem) throw errMem;

      setCampanha(camp);
      setPapel(mem.papel);
    } catch (e) {
      setErro(e.message || 'Não foi possível carregar a campanha.');
    } finally {
      setLoading(false);
    }
  }, [campanhaId, userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const sistema = resolverSistema(campanha?.sistema, campanha?.config);
  const isMestre = papel === 'mestre';

  useEffect(() => {
    const mapaTema = {
      paranormal: 'ordem',
      neutro: 'dnd',
      dnd: 'dnd',
      tormenta: 'tormenta',
      ordem: 'ordem',
    };
    document.body.dataset.tema = sistema.tema || 'neutro';
    document.body.dataset.theme = mapaTema[sistema.tema] || 'ordem';
    return () => {
      document.body.dataset.tema = 'paranormal';
    };
  }, [sistema.tema]);

  return { campanha, setCampanha, papel, isMestre, sistema, loading, erro, recarregar };
}
