import { SISTEMAS } from '../sistemas/index.js';
import geral from './geral.js';
import { BIBLIOTECA_OUTROS } from './outros-sistemas.js';

export function listarBibliotecaPorSistema() {
  const grupos = [];

  for (const sistema of Object.values(SISTEMAS)) {
    if (sistema.biblioteca && sistema.biblioteca.length > 0) {
      grupos.push({
        id: sistema.id,
        nome: sistema.nome,
        links: sistema.biblioteca,
      });
    }
  }

  for (const [id, grupo] of Object.entries(BIBLIOTECA_OUTROS)) {
    grupos.push({
      id,
      nome: grupo.nome,
      links: grupo.links,
    });
  }

  grupos.push({
    id: 'geral',
    nome: 'Ferramentas Gerais',
    links: geral,
  });

  return grupos;
}

export function listarLinksDoSistema(sistemaId) {
  const sistema = SISTEMAS[sistemaId];
  return [
    ...(sistema?.biblioteca || []),
    ...geral,
  ];
}
