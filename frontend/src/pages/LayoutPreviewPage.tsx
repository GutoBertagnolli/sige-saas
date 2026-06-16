import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Home,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  Smartphone,
  Users,
} from 'lucide-react';

const quickActions = [
  { label: 'Registrar afastamento', detail: 'Novo lancamento', icon: Plus },
  { label: 'Criar substituicao', detail: 'A partir do planner', icon: ClipboardList },
  { label: 'Consultar horario', detail: 'Professor ou turma', icon: CalendarDays },
  { label: 'Enviar mensagem', detail: 'Quadro de avisos', icon: Megaphone },
];

const summaryCards = [
  { label: 'Substituicoes pendentes', value: '4', tone: 'amber' },
  { label: 'Afastamentos hoje', value: '7', tone: 'red' },
  { label: 'Mensagens ativas', value: '3', tone: 'blue' },
  { label: 'Relatorios gerados', value: '12', tone: 'slate' },
];

const todaySchedule = [
  {
    time: '07:30 - 08:15',
    title: '6o Ano A',
    description: 'Matematica - Sala 04',
    status: 'Substituto definido',
  },
  {
    time: '08:15 - 09:00',
    title: '7o Ano B',
    description: 'Portugues - Sala 08',
    status: 'Aguardando aceite',
  },
  {
    time: '09:00 - 09:45',
    title: '9o Ano A',
    description: 'Ciencias - Laboratorio',
    status: 'Livre',
  },
];

const bottomItems = [
  { label: 'Inicio', icon: Home, active: true },
  { label: 'Afast.', icon: CalendarDays },
  { label: 'Subst.', icon: ClipboardList },
  { label: 'Avisos', icon: Bell },
  { label: 'Mais', icon: MoreHorizontal },
];

function toneClass(tone: string) {
  const classes: Record<string, string> = {
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    red: 'border-red-200 bg-red-50 text-red-950',
    blue: 'border-blue-200 bg-blue-50 text-blue-950',
    slate: 'border-slate-200 bg-white text-slate-950',
  };

  return classes[tone] || classes.slate;
}

export default function LayoutPreviewPage() {
  return (
    <section className="min-h-full bg-slate-100 pb-24 md:pb-6">
      <div className="mx-auto grid max-w-7xl gap-5 p-4 md:p-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  <Smartphone className="h-3.5 w-3.5" />
                  Proposta para PC, celular e futuro app
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  Central operacional SIGE
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Uma tela inicial mais direta, com busca, alertas e atalhos para as tarefas que a equipe faz todos os dias.
                </p>
              </div>

              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" />
                Nova acao
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-3">
              <Search className="h-5 w-5 flex-none text-slate-500" />
              <div className="min-w-0 flex-1 text-sm text-slate-500">
                Buscar servidor, turma, escola, afastamento ou relatorio...
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <button
                key={card.label}
                type="button"
                className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass(card.tone)}`}
              >
                <div className="text-3xl font-bold">{card.value}</div>
                <div className="mt-2 text-sm font-medium">{card.label}</div>
                <div className="mt-3 text-xs opacity-75">Abrir lista filtrada</div>
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Agenda de hoje</h3>
                  <p className="text-sm text-slate-500">Substituicoes e horarios importantes.</p>
                </div>
                <button className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700">
                  Semana
                </button>
              </div>

              <div className="space-y-3">
                {todaySchedule.map((item) => (
                  <article
                    key={`${item.time}-${item.title}`}
                    className="grid gap-3 rounded-2xl border bg-slate-50 p-4 sm:grid-cols-[120px_1fr_auto]"
                  >
                    <div className="text-sm font-semibold text-slate-950">{item.time}</div>
                    <div>
                      <div className="font-semibold text-slate-950">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                    </div>
                    <div className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-5">
              <h3 className="text-lg font-semibold text-slate-950">Atalhos</h3>
              <div className="mt-4 grid gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-950">{action.label}</span>
                        <span className="block text-xs text-slate-500">{action.detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-950">
              <Megaphone className="h-5 w-5" />
              <h3 className="font-semibold">Avisos importantes</h3>
            </div>
            <div className="mt-4 rounded-xl border border-red-200 bg-white/70 p-3">
              <div className="text-sm font-semibold text-slate-950">Reuniao pedagogica</div>
              <div className="mt-1 text-xs font-semibold text-red-700">
                Esta mensagem venceu em 14/06/2026
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Mantida abaixo das mensagens novas para consulta historica.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-950">Como ficaria no celular</h3>
            <p className="mt-1 text-sm text-slate-500">
              A barra inferior deixa as acoes mais usadas sempre ao alcance.
            </p>
            <div className="mt-4 rounded-[28px] border bg-slate-950 p-3 shadow-sm">
              <div className="rounded-[22px] bg-slate-100 p-3">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-xs text-slate-500">Hoje</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">4 pendencias</div>
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-950">
                    Substituicao aguardando aceite
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-sm font-medium text-blue-950">
                    07:30 - 6o Ano A - Sala 04
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-950">Principios da proposta</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                <span>Menos cadastros soltos, mais acoes claras.</span>
              </div>
              <div className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-none text-blue-600" />
                <span>Horarios e substituicoes aparecem com prioridade.</span>
              </div>
              <div className="flex gap-2">
                <FileText className="mt-0.5 h-4 w-4 flex-none text-slate-600" />
                <span>Relatorios ficam separados por finalidade.</span>
              </div>
              <div className="flex gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-none text-violet-600" />
                <span>Busca global ajuda secretaria, direcao e professores.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-white px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        {bottomItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold ${
                item.active ? 'bg-slate-950 text-white' : 'text-slate-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </section>
  );
}
