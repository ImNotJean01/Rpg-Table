import test from 'node:test';
import assert from 'node:assert/strict';

import { parseExpressaoDados } from '../src/lib/dados.js';
import { SISTEMAS, resolverSistema } from '../src/sistemas/index.js';
import { listarBibliotecaPorSistema } from '../src/biblioteca/index.js';
import {
  encaixarNaGrade,
  tamanhoParaPixels,
  telaParaMundo,
} from '../src/components/tabuleiro/utils.js';
import { celulasDoPincel, celulasDoRetangulo } from '../src/components/tabuleiro/texturas.js';
import { aplicarCarimbo } from '../src/components/tabuleiro/assistente/carimbos.js';
import { gerarMasmorra } from '../src/components/tabuleiro/assistente/geradorMasmorra.js';
import { AMBIENTES, RECOMENDACOES_POR_AMBIENTE } from '../src/components/tabuleiro/assistente/recomendacoes.js';
import { criarHistorico } from '../src/components/tabuleiro/historico.js';
import { dividirPorMarcador } from '../src/lib/historia.js';

test('parseExpressaoDados interpreta expressões válidas e rejeita inválidas', () => {
  assert.deepEqual(parseExpressaoDados('2d6+3'), { qtd: 2, faces: 6, mod: 3 });
  assert.deepEqual(parseExpressaoDados('d20'), { qtd: 1, faces: 20, mod: 0 });
  assert.deepEqual(parseExpressaoDados(' 3d8 - 2 '), { qtd: 3, faces: 8, mod: -2 });
  assert.equal(parseExpressaoDados('0d20'), null);
  assert.equal(parseExpressaoDados('abc'), null);
  assert.equal(parseExpressaoDados('50d20'), null);
});

test('Ordem Paranormal aplica regra de maior/menor corretamente', () => {
  const op = SISTEMAS['ordem-paranormal'];
  assert.deepEqual(op.teste(3, 5), { qtd: 3, faces: 20, manter: 'maior', mod: 5 });
  assert.deepEqual(op.teste(0, 5), { qtd: 2, faces: 20, manter: 'menor', mod: 5 });
  assert.deepEqual(op.teste(-1, 0), { qtd: 2, faces: 20, manter: 'menor', mod: 0 });
});

test('Todos os sistemas registrados possuem campos obrigatórios', () => {
  for (const sistema of Object.values(SISTEMAS)) {
    assert.ok(sistema.id);
    assert.ok(sistema.nome);
    assert.ok(Array.isArray(sistema.atributos) && sistema.atributos.length > 0);
    assert.ok(Array.isArray(sistema.recursos) && sistema.recursos.length > 0);
    assert.equal(typeof sistema.teste, 'function');
    assert.ok(typeof sistema.guia === 'string' && sistema.guia.length > 20);
  }
});

test('resolverSistema aplica atributos customizados no modo Genérico', () => {
  const custom = resolverSistema('generico', {
    atributos: [{ id: 'pod', sigla: 'POD', nome: 'Poder' }],
  });
  assert.equal(custom.atributos.length, 1);
  assert.equal(custom.atributos[0].sigla, 'POD');
});

test('Todos os links padrão da Biblioteca são válidos e começam com https://', () => {
  const grupos = listarBibliotecaPorSistema();
  assert.ok(grupos.length >= 3);
  for (const g of grupos) {
    for (const item of g.links) {
      assert.ok(item.titulo, `Faltou título em ${g.id}`);
      assert.ok(item.url.startsWith('https://'), `URL inválida: ${item.url}`);
      assert.ok(item.categoria);
      assert.ok(item.idioma);
    }
  }
});

test('Utilitários do tabuleiro calculam grade e coordenadas corretamente', () => {
  assert.equal(tamanhoParaPixels('medio', 70), 70);
  assert.equal(tamanhoParaPixels('grande', 70), 140);
  assert.equal(tamanhoParaPixels('minusculo', 70), 35);

  assert.deepEqual(encaixarNaGrade(102, 178, 70, 'medio'), { x: 70, y: 210 });
  assert.deepEqual(encaixarNaGrade(50, 50, 70, 'minusculo'), { x: 35, y: 35 });

  assert.deepEqual(telaParaMundo(260, 140, { x: 60, y: 40 }, 2), { x: 100, y: 50 });
});

test('Pincel, retângulo, carimbos, gerador e recomendações da Fase 2 funcionam', () => {
  assert.equal(celulasDoPincel(5, 5, 1).length, 1);
  assert.equal(celulasDoPincel(5, 5, 3).length, 9);
  assert.equal(celulasDoRetangulo(1, 1, 3, 2).length, 6);

  const sala = aplicarCarimbo('sala-masmorra', 10, 10);
  assert.equal(sala['10,10'], 'parede');
  assert.equal(sala['11,11'], 'pedra');

  const planta = gerarMasmorra({ estilo: 'masmorra', porte: 'pequeno' });
  assert.ok(planta.salas.length >= 2);
  assert.ok(Object.keys(planta.patch).length > 20);

  for (const amb of AMBIENTES) {
    assert.ok(RECOMENDACOES_POR_AMBIENTE[amb.id]?.length > 0);
  }
});

test('Histórico de desfazer/refazer executa ações na ordem certa', async () => {
  let valor = 0;
  const hist = criarHistorico(10);
  hist.registrar({
    desfazer: () => { valor = 0; },
    refazer: () => { valor = 1; },
  });
  valor = 1;
  assert.equal(hist.podeDesfazer(), true);
  await hist.desfazer();
  assert.equal(valor, 0);
  assert.equal(hist.podeRefazer(), true);
  await hist.refazer();
  assert.equal(valor, 1);
});

test('dividirPorMarcador separa capítulos quando encontra ---fim--- ou ===', () => {
  assert.deepEqual(dividirPorMarcador('Capítulo único.'), ['Capítulo único.']);
  assert.deepEqual(
    dividirPorMarcador('Parte um.\n---fim---\nParte dois.\n===\nParte três.'),
    ['Parte um.', 'Parte dois.', 'Parte três.']
  );
});
