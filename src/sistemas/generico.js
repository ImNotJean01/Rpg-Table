export default {
  id: 'generico',
  nome: 'Genérico / Livre',
  descricao: 'Atributos e campos personalizáveis direto na campanha.',
  tema: 'neutro',
  usaConfigDaCampanha: true,

  atributos: [
    { id: 'for', sigla: 'FOR', nome: 'Força' },
    { id: 'des', sigla: 'DES', nome: 'Destreza' },
    { id: 'int', sigla: 'INT', nome: 'Inteligência' },
    { id: 'car', sigla: 'CAR', nome: 'Carisma' },
  ],

  recursos: [
    { id: 'pv', nome: 'Vida (PV)', cor: '#2b8a3e', padrao: 20 },
    { id: 'pm', nome: 'Energia / Mana', cor: '#1c7ed6', padrao: 10 },
  ],

  campos: [
    { id: 'raca_origem', nome: 'Raça / Origem', tipo: 'texto' },
    { id: 'classe_papel', nome: 'Classe / Papel', tipo: 'texto' },
    { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 },
    { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 10 },
  ],

  condicoes: ['Ferido', 'Inconsciente', 'Caído', 'Atordoado', 'Envenenado', 'Invisível'],

  pericias: {
    niveis: [
      { id: 'sem_treino', nome: 'Sem treino', bonus: 0 },
      { id: 'treinado', nome: 'Treinado', bonus: 2 },
      { id: 'mestre', nome: 'Mestre', bonus: 5 },
    ],
    lista: [
      { id: 'atletismo', nome: 'Atletismo', atributo: 'for' },
      { id: 'furtividade', nome: 'Furtividade', atributo: 'des' },
      { id: 'percepcao', nome: 'Percepção', atributo: 'int' },
      { id: 'persuasao', nome: 'Persuasão', atributo: 'car' },
      { id: 'conhecimento', nome: 'Conhecimento', atributo: 'int' },
      { id: 'combate', nome: 'Combate', atributo: 'for' },
    ],
  },

  listas: [
    {
      id: 'habilidades',
      nome: 'Habilidades & Magias',
      campos: [
        { id: 'nome', nome: 'Nome', tipo: 'texto' },
        { id: 'custo', nome: 'Custo', tipo: 'texto' },
        { id: 'descricao', nome: 'Descrição', tipo: 'texto' },
      ],
    },
    {
      id: 'inventario',
      nome: 'Equipamentos',
      campos: [
        { id: 'item', nome: 'Item', tipo: 'texto' },
        { id: 'qtd', nome: 'Qtd.', tipo: 'texto' },
        { id: 'notas', nome: 'Notas', tipo: 'texto' },
      ],
    },
  ],

  teste(valorAtributo, bonus = 0) {
    const mod = (Number(valorAtributo) || 0) + (Number(bonus) || 0);
    return { qtd: 1, faces: 20, manter: 'todos', mod };
  },

  criatura: {
    campos: [
      { id: 'tipo', nome: 'Tipo', tipo: 'texto' },
      { id: 'desafio', nome: 'Nível / Desafio', tipo: 'texto' },
      { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 12 },
    ],
    recursos: [{ id: 'pv', nome: 'Vida (PV)', cor: '#c92a42', padrao: 30 }],
  },

  tamanhos: [
    { id: 'minusculo', nome: 'Minúsculo', escala: 0.5 },
    { id: 'medio', nome: 'Pequeno / Médio', escala: 1 },
    { id: 'grande', nome: 'Grande', escala: 2 },
    { id: 'enorme', nome: 'Enorme', escala: 3 },
    { id: 'colossal', nome: 'Colossal', escala: 4 },
  ],

  guia: `# Sistema Genérico / Livre\n\nEste molde permite jogar qualquer cenário ou regra da casa. O mestre pode personalizar atributos, recursos e campos nas **Configurações** da campanha.\n\n- **Teste padrão:** \`1d20 + Atributo + Bônus\`.`,

  biblioteca: [],
};
