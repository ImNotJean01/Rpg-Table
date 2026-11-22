import guiaT20 from './guias/tormenta20.js';

export default {
  id: 'tormenta20',
  nome: 'Tormenta 20',
  descricao: 'Fantasia épica brasileira em Arton contra a Tormenta.',
  tema: 'tormenta',

  atributos: [
    { id: 'for', sigla: 'FOR', nome: 'Força' },
    { id: 'des', sigla: 'DES', nome: 'Destreza' },
    { id: 'con', sigla: 'CON', nome: 'Constituição' },
    { id: 'int', sigla: 'INT', nome: 'Inteligência' },
    { id: 'sab', sigla: 'SAB', nome: 'Sabedoria' },
    { id: 'car', sigla: 'CAR', nome: 'Carisma' },
  ],

  recursos: [
    { id: 'pv', nome: 'Vida (PV)', cor: '#e11d48', padrao: 20 },
    { id: 'pm', nome: 'Mana (PM)', cor: '#d97706', padrao: 6 },
  ],

  campos: [
    {
      id: 'classe',
      nome: 'Classe',
      tipo: 'select',
      opcoes: [
        'Arcanista',
        'Bárbaro',
        'Bardo',
        'Bucaneiro',
        'Caçador',
        'Cavaleiro',
        'Clérigo',
        'Druida',
        'Guerreiro',
        'Inventor',
        'Ladino',
        'Lutador',
        'Nobre',
        'Paladino',
      ],
    },
    { id: 'raca', nome: 'Raça', tipo: 'texto' },
    { id: 'origem', nome: 'Origem', tipo: 'texto' },
    { id: 'divindade', nome: 'Divindade', tipo: 'texto' },
    { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 },
    { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 10 },
    { id: 'deslocamento', nome: 'Deslocamento', tipo: 'texto', padrao: '9m (6q)' },
  ],

  condicoes: [
    'Abalado',
    'Agarrado',
    'Atordoado',
    'Caído',
    'Cego',
    'Confuso',
    'Desprevenido',
    'Enjoado',
    'Exausto',
    'Inconsciente',
    'Invisível',
    'Paralisado',
    'Sangrando',
  ],

  pericias: {
    niveis: [
      { id: 'destreinado', nome: 'Destreinado', bonus: 0 },
      { id: 'treinado', nome: 'Treinado', bonus: 2 },
      { id: 'veterano', nome: 'Veterano', bonus: 4 },
      { id: 'mestre', nome: 'Mestre', bonus: 6 },
    ],
    lista: [
      { id: 'acrobacia', nome: 'Acrobacia', atributo: 'des' },
      { id: 'adestramento', nome: 'Adestramento', atributo: 'car' },
      { id: 'atletismo', nome: 'Atletismo', atributo: 'for' },
      { id: 'atuacao', nome: 'Atuação', atributo: 'car' },
      { id: 'cavalgar', nome: 'Cavalgar', atributo: 'des' },
      { id: 'conhecimento', nome: 'Conhecimento', atributo: 'int' },
      { id: 'cura', nome: 'Cura', atributo: 'sab' },
      { id: 'diplomacia', nome: 'Diplomacia', atributo: 'car' },
      { id: 'enganacao', nome: 'Enganação', atributo: 'car' },
      { id: 'fortitude', nome: 'Fortitude', atributo: 'con' },
      { id: 'furtividade', nome: 'Furtividade', atributo: 'des' },
      { id: 'guerra', nome: 'Guerra', atributo: 'int' },
      { id: 'iniciativa', nome: 'Iniciativa', atributo: 'des' },
      { id: 'intimidacao', nome: 'Intimidação', atributo: 'car' },
      { id: 'intuicao', nome: 'Intuição', atributo: 'sab' },
      { id: 'investigacao', nome: 'Investigação', atributo: 'int' },
      { id: 'ladinagem', nome: 'Ladinagem', atributo: 'des' },
      { id: 'luta', nome: 'Luta', atributo: 'for' },
      { id: 'misticismo', nome: 'Misticismo', atributo: 'int' },
      { id: 'nobreza', nome: 'Nobreza', atributo: 'int' },
      { id: 'percepcao', nome: 'Percepção', atributo: 'sab' },
      { id: 'pontaria', nome: 'Pontaria', atributo: 'des' },
      { id: 'reflexos', nome: 'Reflexos', atributo: 'des' },
      { id: 'religiao', nome: 'Religião', atributo: 'sab' },
      { id: 'sobrevivencia', nome: 'Sobrevivência', atributo: 'sab' },
      { id: 'vontade', nome: 'Vontade', atributo: 'sab' },
    ],
  },

  listas: [
    {
      id: 'poderes',
      nome: 'Poderes & Magias',
      campos: [
        { id: 'nome', nome: 'Nome', tipo: 'texto' },
        { id: 'custo', nome: 'Custo PM', tipo: 'texto' },
        { id: 'execucao', nome: 'Execução', tipo: 'texto' },
        { id: 'descricao', nome: 'Descrição', tipo: 'texto' },
      ],
    },
    {
      id: 'inventario',
      nome: 'Equipamentos & Armas',
      campos: [
        { id: 'item', nome: 'Item / Arma', tipo: 'texto' },
        { id: 'espacos', nome: 'Espaços', tipo: 'texto' },
        { id: 'detalhes', nome: 'Dano / Notas', tipo: 'texto' },
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
      { id: 'nd', nome: 'ND (Desafio)', tipo: 'texto', padrao: '1' },
      { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 15 },
      { id: 'deslocamento', nome: 'Deslocamento', tipo: 'texto', padrao: '9m' },
    ],
    recursos: [{ id: 'pv', nome: 'Vida (PV)', cor: '#e11d48', padrao: 40 }],
  },

  tamanhos: [
    { id: 'minusculo', nome: 'Minúsculo', escala: 0.5 },
    { id: 'medio', nome: 'Pequeno / Médio', escala: 1 },
    { id: 'grande', nome: 'Grande', escala: 2 },
    { id: 'enorme', nome: 'Enorme', escala: 3 },
    { id: 'colossal', nome: 'Colossal', escala: 4 },
  ],

  guia: guiaT20,

  biblioteca: [
    {
      titulo: 'Kit Introdutório de Tormenta20 (Grátis Oficial)',
      url: 'https://jamboeditora.com.br',
      categoria: 'oficial',
      idioma: 'pt',
      gratis: true,
      descricao: 'Busque por "Tormenta20 Kit Introdutório" na loja da Jambô (R$ 0,00 com conta gratuita): regras, aventura e 8 fichas.',
    },
    {
      titulo: 'Jambô Editora — Livro Básico e Suplementos',
      url: 'https://jamboeditora.com.br',
      categoria: 'loja',
      idioma: 'pt',
      gratis: false,
      descricao: 'Loja oficial do livro básico, Ameaças de Arton, Atlas e suplementos.',
    },
  ],
};
