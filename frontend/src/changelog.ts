export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.4.57',
    date: '25/06/2026',
    title: 'Atualizacoes compactas',
    changes: [
      'A tela de Atualizacoes passou a mostrar inicialmente apenas versao e data.',
      'As descricoes ficaram recolhidas em formato drill down.',
      'Ao expandir uma versao, o sistema mostra o titulo e os detalhes da melhoria.',
    ],
  },
  {
    version: '0.4.56',
    date: '25/06/2026',
    title: 'Historico de atualizacoes',
    changes: [
      'Criada a aba Atualizacoes dentro de Logs.',
      'Adicionada a visualizacao da versao atual do SIGE.',
      'Incluida linha do tempo com melhorias e alteracoes recentes.',
    ],
  },
  {
    version: '0.4.55',
    date: '22/06/2026',
    title: 'Login mais pratico',
    changes: [
      'Adicionado botao de olho para mostrar ou ocultar a senha no login administrativo.',
      'Adicionado o mesmo recurso no Portal do servidor.',
    ],
  },
  {
    version: '0.4.54',
    date: '22/06/2026',
    title: 'Sessoes online e logoff forcado',
    changes: [
      'Criada a visualizacao de usuarios online em Logs.',
      'Adicionada a opcao de forcar logoff de um usuario.',
      'Adicionada a opcao de forcar logoff geral para atualizacoes.',
      'Adicionado controle de sessoes com verificacao automatica no frontend.',
    ],
  },
  {
    version: '0.4.53',
    date: '22/06/2026',
    title: 'Perfil de acesso inativo',
    changes: [
      'Adicionado perfil Inativo no controle de acessos.',
      'Permitido inativar o acesso sem excluir o cadastro do servidor.',
      'Usuarios inativos deixam de conseguir fazer login.',
    ],
  },
  {
    version: '0.4.52',
    date: '22/06/2026',
    title: 'Planner com escolas por aula',
    changes: [
      'Planner passou a mostrar todas as aulas cadastradas do servidor.',
      'Incluida escola vinculada ao horario do professor.',
      'Ajustado escopo para diretor e orientador visualizarem apenas dados da sua escola.',
    ],
  },
  {
    version: '0.4.51',
    date: '22/06/2026',
    title: 'Seguranca por escola',
    changes: [
      'Revisado acesso de diretor e orientador por escola.',
      'Bloqueadas alteracoes em cadastros fora da escola correspondente.',
    ],
  },
  {
    version: '0.4.50',
    date: '22/06/2026',
    title: 'Vinculo de servidor com varias escolas',
    changes: [
      'Servidor passou a poder atuar em mais de uma escola.',
      'Cadastro de servidor recebeu selecao de escolas adicionais.',
      'Preparada a base para operacao multiempresa e multiescola.',
    ],
  },
  {
    version: '0.4.49',
    date: '21/06/2026',
    title: 'Banco de horas com justificativa',
    changes: [
      'Criado campo para afastamento justificado.',
      'Quando marcado, o afastamento nao desconta do banco de horas.',
      'Incluido campo de justificativa da ausencia.',
    ],
  },
];
