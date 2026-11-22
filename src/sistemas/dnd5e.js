import guiaDnd from './guias/dnd5e.js';

export default {
  id: 'dnd5e',
  nome: 'D&D 5ª Edição',
  descricao: 'Alta fantasia clássica, masmorras, dragões e magia.',
  tema: 'dnd',

  atributos: [
    { id: 'for', sigla: 'FOR', nome: 'Força' },
    { id: 'des', sigla: 'DES', nome: 'Destreza' },
    { id: 'con', sigla: 'CON', nome: 'Constituição' },
    { id: 'int', sigla: 'INT', nome: 'Inteligência' },
    { id: 'sab', sigla: 'SAB', nome: 'Sabedoria' },
    { id: 'car', sigla: 'CAR', nome: 'Carisma' },
  ],

  recursos: [
    { id: 'pv', nome: 'Vida (PV)', cor: '#c8a96a', padrao: 12 },
    { id: 'magia', nome: 'Espaços de Magia', cor: '#4ea89e', padrao: 2 },
  ],

  campos: [
    {
      id: 'classe',
      nome: 'Classe',
      tipo: 'select',
      opcoes: [
        'Artífice',
        'Bárbaro',
        'Bardo',
        'Bruxo',
        'Clérigo',
        'Druida',
        'Feiticeiro',
        'Guerreiro',
        'Ladino',
        'Mago',
        'Monge',
        'Paladino',
        'Patrulheiro',
      ],
    },
    { id: 'raca', nome: 'Raça / Espécie', tipo: 'texto' },
    { id: 'antecedente', nome: 'Antecedente', tipo: 'texto' },
    { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 },
    { id: 'ca', nome: 'CA (Armadura)', tipo: 'numero', padrao: 12 },
    { id: 'deslocamento', nome: 'Deslocamento', tipo: 'texto', padrao: '9m (6q)' },
  ],

  condicoes: [
    'Caído',
    'Agarrado',
    'Amedrontado',
    'Atordoado',
    'Cego',
    'Enfeitiçado',
    'Envenenado',
    'Incapacitado',
    'Inconsciente',
    'Invisível',
    'Paralisado',
    'Petrificado',
  ],

  pericias: {
    niveis: [
      { id: 'sem_prof', nome: 'Sem prof.', bonus: 0 },
      { id: 'proficiente', nome: 'Proficiente', bonus: 2 },
      { id: 'especialista', nome: 'Especialista', bonus: 4 },
      { id: 'mestre', nome: 'Mestre', bonus: 6 },
    ],
    lista: [
      { id: 'acrobacia', nome: 'Acrobacia', atributo: 'des' },
      { id: 'arcanismo', nome: 'Arcanismo', atributo: 'int' },
      { id: 'atletismo', nome: 'Atletismo', atributo: 'for' },
      { id: 'atuacao', nome: 'Atuação', atributo: 'car' },
      { id: 'enganacao', nome: 'Enganação', atributo: 'car' },
      { id: 'furtividade', nome: 'Furtividade', atributo: 'des' },
      { id: 'historia', nome: 'História', atributo: 'int' },
      { id: 'intimidacao', nome: 'Intimidação', atributo: 'car' },
      { id: 'intuicao', nome: 'Intuição', atributo: 'sab' },
      { id: 'investigacao', nome: 'Investigação', atributo: 'int' },
      { id: 'lidar_animais', nome: 'Lidar com Animais', atributo: 'sab' },
      { id: 'medicina', nome: 'Medicina', atributo: 'sab' },
      { id: 'natureza', nome: 'Natureza', atributo: 'int' },
      { id: 'percepcao', nome: 'Percepção', atributo: 'sab' },
      { id: 'persuasao', nome: 'Persuasão', atributo: 'car' },
      { id: 'prestidigitacao', nome: 'Prestidigitação', atributo: 'des' },
      { id: 'religiao', nome: 'Religião', atributo: 'int' },
      { id: 'sobrevivencia', nome: 'Sobrevivência', atributo: 'sab' },
    ],
  },

  listas: [
    {
      id: 'magias',
      nome: 'Magias & Truques',
      campos: [
        { id: 'nome', nome: 'Magia', tipo: 'texto' },
        { id: 'circulo', nome: 'Círculo', tipo: 'texto' },
        { id: 'alcance', nome: 'Alcance', tipo: 'texto' },
        { id: 'descricao', nome: 'Efeito', tipo: 'texto' },
      ],
    },
    {
      id: 'inventario',
      nome: 'Equipamentos & Armas',
      campos: [
        { id: 'item', nome: 'Item / Arma', tipo: 'texto' },
        { id: 'qtd', nome: 'Qtd.', tipo: 'texto' },
        { id: 'detalhes', nome: 'Dano / Notas', tipo: 'texto' },
      ],
    },
  ],

  /**
   * Aceita tanto o valor clássico (ex: 16 -> +3) quanto o modificador direto (ex: 3 -> +3).
   */
  teste(valorAtributo, bonus = 0) {
    const val = Number(valorAtributo) || 0;
    const modAtr = val >= 6 ? Math.floor((val - 10) / 2) : val;
    const mod = modAtr + (Number(bonus) || 0);
    return { qtd: 1, faces: 20, manter: 'todos', mod };
  },

  criatura: {
    campos: [
      { id: 'tipo', nome: 'Tipo', tipo: 'texto' },
      { id: 'nd', nome: 'ND (Desafio)', tipo: 'texto', padrao: '1' },
      { id: 'ca', nome: 'CA', tipo: 'numero', padrao: 13 },
      { id: 'deslocamento', nome: 'Deslocamento', tipo: 'texto', padrao: '9m' },
    ],
    recursos: [{ id: 'pv', nome: 'Vida (PV)', cor: '#c8a96a', padrao: 30 }],
  },

  tamanhos: [
    { id: 'minusculo', nome: 'Miúdo', escala: 0.5 },
    { id: 'medio', nome: 'Pequeno / Médio', escala: 1 },
    { id: 'grande', nome: 'Grande', escala: 2 },
    { id: 'enorme', nome: 'Enorme', escala: 3 },
    { id: 'colossal', nome: 'Imenso', escala: 4 },
  ],

  guia: guiaDnd,

  biblioteca: [
    {
      titulo: 'Pocket DM — Compêndio SRD em Português',
      url: 'https://www.pocketdm.com.br',
      categoria: 'referencia',
      idioma: 'pt',
      gratis: true,
      descricao: 'Regras abertas (SRD 5.1 e 5.2.1), magias e monstros traduzidos para o português.',
    },
    {
      titulo: 'Artifício RPG — Tradução do SRD 5.2',
      url: 'https://artificiorpg.com',
      categoria: 'referencia',
      idioma: 'pt',
      gratis: true,
      descricao: 'Material de referência gratuito em português baseado na licença aberta (CC-BY-4.0).',
    },
    {
      titulo: 'D&D Beyond — SRD v5.2.1 Oficial (Wizards)',
      url: 'https://www.dndbeyond.com/resources/systems-reference-document',
      categoria: 'oficial',
      idioma: 'en',
      gratis: true,
      descricao: 'Documento oficial gratuito da Wizards of the Coast (sem versão oficial em português).',
    },
    {
      titulo: 'Galápagos Jogos — Editora Oficial no Brasil',
      url: 'https://www.mundogalapagos.com.br',
      categoria: 'loja',
      idioma: 'pt',
      gratis: false,
      descricao: 'Livros físicos oficiais de D&D em português no Brasil.',
    },
  ],
};
