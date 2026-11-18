/**
 * Pilha simples de desfazer/refazer para ações do tabuleiro.
 * Cada entrada tem { tipo, desfazer: fn, refazer: fn }.
 */
export function criarHistorico(limite = 40) {
  let passado = [];
  let futuro = [];

  return {
    registrar(acao) {
      passado = [...passado.slice(-(limite - 1)), acao];
      futuro = [];
    },
    podeDesfazer() {
      return passado.length > 0;
    },
    podeRefazer() {
      return futuro.length > 0;
    },
    async desfazer() {
      if (passado.length === 0) return false;
      const acao = passado[passado.length - 1];
      passado = passado.slice(0, -1);
      futuro = [acao, ...futuro];
      await acao.desfazer();
      return true;
    },
    async refazer() {
      if (futuro.length === 0) return false;
      const [acao, ...resto] = futuro;
      futuro = resto;
      passado = [...passado, acao];
      await acao.refazer();
      return true;
    },
    limpar() {
      passado = [];
      futuro = [];
    },
  };
}
