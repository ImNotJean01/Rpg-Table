import ordem from './ordem-paranormal.js';
import generico from './generico.js';

export const SISTEMAS = {
  [ordem.id]: ordem,
  [generico.id]: generico,
};

export function resolverSistema(sistemaId, configCampanha = {}) {
  const base = SISTEMAS[sistemaId] || generico;
  if (!base.usaConfigDaCampanha || !configCampanha) return base;

  return {
    ...base,
    atributos: Array.isArray(configCampanha.atributos) && configCampanha.atributos.length
      ? configCampanha.atributos
      : base.atributos,
    recursos: Array.isArray(configCampanha.recursos) && configCampanha.recursos.length
      ? configCampanha.recursos
      : base.recursos,
    campos: Array.isArray(configCampanha.campos) && configCampanha.campos.length
      ? configCampanha.campos
      : base.campos,
  };
}
