export const AMBIENTES = [
  { id: 'masmorra', nome: 'Masmorra / Ruína' },
  { id: 'mansao', nome: 'Mansão / Investigação' },
  { id: 'taverna', nome: 'Taverna / Abrigo' },
  { id: 'floresta', nome: 'Floresta / Estrada' },
  { id: 'laboratorio', nome: 'Laboratório / Bunker' },
];

export const RECOMENDACOES_POR_AMBIENTE = {
  masmorra: [
    {
      espaco: 'Entrada & Corredores',
      itens: [
        {
          nome: 'Armadilha de Entrada',
          icone: 'armadilha',
          cor: '#e67700',
          tamanho: 'medio',
          notas: 'Placa de pressão oculta. Percepção DT 15 para notar; Reflexos DT 15 para evitar.',
        },
        {
          nome: 'Porta Trancada',
          icone: 'porta',
          cor: '#d4a017',
          tamanho: 'medio',
          notas: 'Chave fica com o vigia ou no altar. Crime/Arrombamento DT 18.',
        },
      ],
    },
    {
      espaco: 'Salas Intermediárias',
      itens: [
        {
          nome: 'Baú / Suprimentos',
          icone: 'bau',
          cor: '#d4a017',
          tamanho: 'medio',
          notas: 'Contém munição, kit médico ou pista da região.',
        },
        {
          nome: 'Patrulha / Criatura',
          icone: 'monstro',
          cor: '#c92a42',
          tamanho: 'medio',
          notas: 'Ouve barulhos na sala anterior se os jogadores falharem em Furtividade.',
        },
      ],
    },
    {
      espaco: 'Câmara Central / Chefe',
      itens: [
        {
          nome: 'Ameaça Principal',
          icone: 'chefe',
          cor: '#c92a42',
          tamanho: 'grande',
          notas: 'Use os pilares como cobertura. Revelar apenas quando o grupo cruzar a porta.',
        },
      ],
    },
  ],

  mansao: [
    {
      espaco: 'Hall & Corredores',
      itens: [
        {
          nome: 'Marca Paranormal',
          icone: 'local',
          cor: '#7c4dff',
          tamanho: 'medio',
          notas: 'Símbolo raspado na madeira. Ocultismo DT 15 revela o elemento ligado ao caso.',
        },
        {
          nome: 'Testemunha / Morador',
          icone: 'npc',
          cor: '#1c7ed6',
          tamanho: 'medio',
          notas: 'Assustado; Diplomacia ou Intuição DT 12 revela o que viu na noite passada.',
        },
      ],
    },
    {
      espaco: 'Escritório & Biblioteca',
      itens: [
        {
          nome: 'Documentos / Diário',
          icone: 'local',
          cor: '#d4a017',
          tamanho: 'medio',
          notas: 'Investigação DT 15 encontra fundo falso na gaveta com cartas comprometedoras.',
        },
      ],
    },
    {
      espaco: 'Porão / Sótão',
      itens: [
        {
          nome: 'Foco do Ritual',
          icone: 'mago',
          cor: '#7c4dff',
          tamanho: 'medio',
          notas: 'Temperatura cai bruscamente. Presença Perturbadora ao entrar.',
        },
      ],
    },
  ],

  taverna: [
    {
      espaco: 'Salão Principal',
      itens: [
        {
          nome: 'Taverneiro / Contato',
          icone: 'npc',
          cor: '#1c7ed6',
          tamanho: 'medio',
          notas: 'Sabe rumores locais e quem passou por aqui recentemente.',
        },
        {
          nome: 'Lareira / Descanso',
          icone: 'fogueira',
          cor: '#e67700',
          tamanho: 'medio',
          notas: 'Ponto seguro para cena de interlúdio e recuperação de recursos.',
        },
      ],
    },
    {
      espaco: 'Fundos & Quartos',
      itens: [
        {
          nome: 'Saída dos Fundos',
          icone: 'porta',
          cor: '#2b8a3e',
          tamanho: 'medio',
          notas: 'Rota de fuga para o beco caso a conversa dê errado.',
        },
      ],
    },
  ],

  floresta: [
    {
      espaco: 'Trilha & Estrada',
      itens: [
        {
          nome: 'Rastros na Lama',
          icone: 'local',
          cor: '#2b8a3e',
          tamanho: 'medio',
          notas: 'Sobrevivência DT 14 identifica quantas criaturas passaram e a direção.',
        },
        {
          nome: 'Ponto de Emboscada',
          icone: 'monstro',
          cor: '#c92a42',
          tamanho: 'medio',
          notas: 'Criatura escondida entre as árvores (Furtividade vs. Percepção do grupo).',
        },
      ],
    },
    {
      espaco: 'Clareira',
      itens: [
        {
          nome: 'Acampamento Abandonado',
          icone: 'fogueira',
          cor: '#e67700',
          tamanho: 'medio',
          notas: 'Cinzas ainda mornas; há uma mochila rasgada com pista.',
        },
      ],
    },
  ],

  laboratorio: [
    {
      espaco: 'Recepção & Segurança',
      itens: [
        {
          nome: 'Porta Eletrônica',
          icone: 'porta',
          cor: '#1c7ed6',
          tamanho: 'medio',
          notas: 'Tecnologia DT 18 para destravar ou usar crachá do cientista.',
        },
        {
          nome: 'Alarme / Câmera',
          icone: 'armadilha',
          cor: '#e67700',
          tamanho: 'medio',
          notas: 'Se disparar, tranca o setor e alerta os guardas.',
        },
      ],
    },
    {
      espaco: 'Sala de Contenção',
      itens: [
        {
          nome: 'Espécime Solto',
          icone: 'monstro',
          cor: '#c92a42',
          tamanho: 'grande',
          notas: 'Vidro quebrado de dentro para fora.',
        },
      ],
    },
  ],
};
