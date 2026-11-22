import ordem from './ordem-paranormal.js';
import dnd5e from './dnd5e.js';
import tormenta20 from './tormenta20.js';
import generico from './generico.js';

export const SISTEMAS = {
  [ordem.id]: ordem,
  [dnd5e.id]: dnd5e,
  [tormenta20.id]: tormenta20,
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
