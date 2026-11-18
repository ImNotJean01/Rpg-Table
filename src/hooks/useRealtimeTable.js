import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Carrega linhas filtradas e mantém sincronizado via Supabase Realtime.
 */
export function useRealtimeTable(
  tabela,
  { filtroColuna = 'campanha_id', filtroValor, orderBy = null, ascending = true, enabled = true } = {}
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!supabase || !enabled || !filtroValor) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from(tabela).select('*').eq(filtroColuna, filtroValor);
    if (orderBy) q = q.order(orderBy, { ascending });
    const { data, error } = await q;
    if (!error && data) setRows(data);
    setLoading(false);
  }, [tabela, filtroColuna, filtroValor, orderBy, ascending, enabled]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!supabase || !enabled || !filtroValor) return;

    const channel = supabase
      .channel(`rt:${tabela}:${filtroColuna}:${filtroValor}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tabela,
          filter: `${filtroColuna}=eq.${filtroValor}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows((prev) => {
              if (prev.some((r) => r.id && r.id === payload.new.id)) return prev;
              const next = [...prev, payload.new];
              if (orderBy) {
                next.sort((a, b) =>
                  ascending
                    ? (a[orderBy] ?? 0) > (b[orderBy] ?? 0) ? 1 : -1
                    : (a[orderBy] ?? 0) < (b[orderBy] ?? 0) ? 1 : -1
                );
              }
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            setRows((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setRows((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tabela, filtroColuna, filtroValor, orderBy, ascending, enabled]);

  return { rows, setRows, loading, recarregar: carregar };
}
