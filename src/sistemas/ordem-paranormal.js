import guiaOrdem from './guias/ordem-paranormal.js';

export default {
  id: 'ordem-paranormal',
  nome: 'Ordem Paranormal',
  descricao: 'Investigação, horror e combate contra o Outro Lado.',
  tema: 'paranormal',

  atributos: [
    { id: 'agi', sigla: 'AGI', nome: 'Agilidade' },
    { id: 'for', sigla: 'FOR', nome: 'Força' },
    { id: 'int', sigla: 'INT', nome: 'Intelecto' },
    { id: 'pre', sigla: 'PRE', nome: 'Presença' },
    { id: 'vig', sigla: 'VIG', nome: 'Vigor' },
  ],

  recursos: [
    { id: 'pv', nome: 'Vida (PV)', cor: '#c92a42', padrao: 20 },
    { id: 'pe', nome: 'Esforço (PE)', cor: '#d4a017', padrao: 4 },
    { id: 'san', nome: 'Sanidade (SAN)', cor: '#7c4dff', padrao: 20 },
  ],

  campos: [
    {
      id: 'classe',
      nome: 'Classe',
      tipo: 'select',
      opcoes: ['Combatente', 'Especialista', 'Ocultista', 'Mundano'],
    },
    { id: 'origem', nome: 'Origem', tipo: 'texto' },
    { id: 'trilha', nome: 'Trilha', tipo: 'texto' },
    { id: 'nex', nome: 'NEX', tipo: 'numero', sufixo: '%', padrao: 5 },
    { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 10 },
    { id: 'deslocamento', nome: 'Deslocamento', tipo: 'texto', padrao: '9m (6q)' },
  ],

  condicoes: [
    'Machucado',
    'Morrendo',
    'Enlouquecendo',
    'Sangrando',
    'Caído',
    'Desprevenido',
    'Atordoado',
    'Agarrado',
    'Invisível',
    'Cego',
  ],

  pericias: {
    niveis: [
      { id: 'destreinado', nome: 'Destreinado', bonus: 0 },
      { id: 'treinado', nome: 'Treinado', bonus: 5 },
      { id: 'veterano', nome: 'Veterano', bonus: 10 },
      { id: 'expert', nome: 'Expert', bonus: 15 },
    ],
    lista: [
      { id: 'acrobacia', nome: 'Acrobacia', atributo: 'agi' },
      { id: 'adestramento', nome: 'Adestramento', atributo: 'pre' },
      { id: 'artes', nome: 'Artes', atributo: 'pre' },
      { id: 'atletismo', nome: 'Atletismo', atributo: 'for' },
      { id: 'atualidades', nome: 'Atualidades', atributo: 'int' },
      { id: 'ciencias', nome: 'Ciências', atributo: 'int' },
      { id: 'crime', nome: 'Crime', atributo: 'agi' },
      { id: 'diplomacia', nome: 'Diplomacia', atributo: 'pre' },
      { id: 'enganacao', nome: 'Enganação', atributo: 'pre' },
      { id: 'fortitude', nome: 'Fortitude', atributo: 'vig' },
      { id: 'furtividade', nome: 'Furtividade', atributo: 'agi' },
      { id: 'iniciativa', nome: 'Iniciativa', atributo: 'agi' },
      { id: 'intimidacao', nome: 'Intimidação', atributo: 'pre' },
      { id: 'intuicao', nome: 'Intuição', atributo: 'pre' },
      { id: 'investigacao', nome: 'Investigação', atributo: 'int' },
      { id: 'luta', nome: 'Luta', atributo: 'for' },
      { id: 'medicina', nome: 'Medicina', atributo: 'int' },
      { id: 'ocultismo', nome: 'Ocultismo', atributo: 'int' },
      { id: 'percepcao', nome: 'Percepção', atributo: 'pre' },
      { id: 'pilotagem', nome: 'Pilotagem', atributo: 'agi' },
      { id: 'pontaria', nome: 'Pontaria', atributo: 'agi' },
      { id: 'profissao', nome: 'Profissão', atributo: 'int' },
      { id: 'reflexos', nome: 'Reflexos', atributo: 'agi' },
      { id: 'religiao', nome: 'Religião', atributo: 'pre' },
      { id: 'sobrevivencia', nome: 'Sobrevivência', atributo: 'int' },
      { id: 'tatica', nome: 'Tática', atributo: 'int' },
      { id: 'tecnologia', nome: 'Tecnologia', atributo: 'int' },
      { id: 'vontade', nome: 'Vontade', atributo: 'pre' },
    ],
  },

  listas: [
    {
      id: 'rituais',
      nome: 'Rituais & Poderes',
      campos: [
        { id: 'nome', nome: 'Nome', tipo: 'texto' },
        {
          id: 'elemento',
          nome: 'Elemento',
          tipo: 'select',
          opcoes: ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo', 'Outro'],
        },
        { id: 'circulo', nome: 'Círculo', tipo: 'texto' },
        { id: 'custo', nome: 'Custo PE', tipo: 'texto' },
        { id: 'descricao', nome: 'Descrição', tipo: 'texto' },
      ],
    },
    {
      id: 'inventario',
      nome: 'Inventário & Armas',
      campos: [
        { id: 'item', nome: 'Item / Arma', tipo: 'texto' },
        { id: 'categoria', nome: 'Cat.', tipo: 'texto' },
        { id: 'espaco', nome: 'Espaços', tipo: 'texto' },
        { id: 'detalhes', nome: 'Dano / Notas', tipo: 'texto' },
      ],
    },
  ],

  /**
   * Regra de Ordem Paranormal:
   * - Atributo >= 1: rola N d20 e mantém o maior.
   * - Atributo <= 0: rola 2d20 e mantém o menor.
   */
  teste(valorAtributo, bonus = 0) {
    const val = Number(valorAtributo) || 0;
    const mod = Number(bonus) || 0;
    if (val > 0) {
      return { qtd: val, faces: 20, manter: 'maior', mod };
    }
    return { qtd: 2, faces: 20, manter: 'menor', mod };
  },

  criatura: {
    campos: [
      {
        id: 'elemento',
        nome: 'Elemento',
        tipo: 'select',
        opcoes: ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo', 'Realidade'],
      },
      { id: 'vd', nome: 'VD', tipo: 'numero', padrao: 20 },
      { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 14 },
      { id: 'presenca', nome: 'Presença Perturbadora', tipo: 'texto' },
      { id: 'deslocamento', nome: 'Deslocamento', tipo: 'texto', padrao: '9m' },
    ],
    recursos: [{ id: 'pv', nome: 'Vida (PV)', cor: '#c92a42', padrao: 40 }],
  },

  tamanhos: [
    { id: 'minusculo', nome: 'Minúsculo', escala: 0.5 },
    { id: 'medio', nome: 'Pequeno / Médio', escala: 1 },
    { id: 'grande', nome: 'Grande', escala: 2 },
    { id: 'enorme', nome: 'Enorme', escala: 3 },
    { id: 'colossal', nome: 'Colossal', escala: 4 },
  ],

  guia: guiaOrdem,

  biblioteca: [
    {
      titulo: 'Site oficial — Ordem Paranormal RPG',
      url: 'https://ordemparanormal.com.br',
      categoria: 'oficial',
      idioma: 'pt',
      gratis: false,
      descricao: 'Portal oficial com novidades, livros, suplementos e universo do jogo.',
    },
    {
      titulo: 'Jambô Editora — Livro de Regras e Suplementos',
      url: 'https://jamboeditora.com.br',
      categoria: 'loja',
      idioma: 'pt',
      gratis: false,
      descricao: 'Loja oficial do PDF e livro físico. Quem adquire recebe erratas e atualizações.',
    },
    {
      titulo: 'Wiki Ordem Paranormal (Comunidade)',
      url: 'https://ordemparanormal.fandom.com',
      categoria: 'referencia',
      idioma: 'pt',
      gratis: true,
      descricao: 'Enciclopédia mantida pela comunidade sobre universo, elementos e criaturas.',
    },
  ],
};
