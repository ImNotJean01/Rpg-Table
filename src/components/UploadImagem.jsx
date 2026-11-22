import { useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase.js';

export default function UploadImagem({ pasta = 'geral', valor, onChange, label = 'Imagem' }) {
  const [subindo, setSubindo] = useState(false);
  const [erro, setErro] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setErro('');
    setSubindo(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('imagens')
        .upload(caminho, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from('imagens').getPublicUrl(caminho);
      onChange(data.publicUrl);
    } catch (err) {
      setErro(err.message || 'Falha ao enviar imagem.');
    } finally {
      setSubindo(false);
    }
  }

  return (
    <div className="stack" style={{ gap: '0.4rem' }}>
      <label className="muted">{label}</label>
      <div className="row">
        <input
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole uma URL https://... ou envie um arquivo"
          style={{ flex: 1, minWidth: 180 }}
        />
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          <UploadSimple size={14} weight="duotone" /> {subindo ? 'Enviando...' : 'Enviar'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
            disabled={subindo}
          />
        </label>
      </div>
      {erro && <span className="muted" style={{ color: '#ff8787' }}>{erro}</span>}
      {valor && (
        <img
          src={valor}
          alt="Pré-visualização"
          style={{
            maxHeight: 120,
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-base)',
          }}
        />
      )}
    </div>
  );
}
