import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

type Slot = {
  id: string;
  slotOrder: number;
  startTime: string;
  endTime: string;
  slotType: string;
  isTeachingTime: boolean;
};

type TimeTemplate = {
  id: string;
  name: string;
  shift: string;
  educationStage: string;
  active: boolean;
  slots?: Slot[];
  school?: {
    id: string;
    name: string;
  };
};

async function getTemplates() {
  const response = await api.get<TimeTemplate[]>('/time-templates');
  return response.data;
}

export default function TimeTemplatesPage() {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['time-templates'],
    queryFn: getTemplates,
  });

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Horários</h2>
            <p className="text-sm text-slate-500">
              Modelos de horários por escola, turno e etapa.
            </p>
          </div>

          <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm">
            Novo modelo
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-2xl p-5 bg-slate-50"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-slate-500">
                      {template.school?.name || 'Escola'} • {template.shift} •{' '}
                      {template.educationStage}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg border text-xs bg-white">
                      Editar
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs bg-white">
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-sm bg-white rounded-xl overflow-hidden">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Ordem</th>
                        <th className="text-left py-2 px-3">Início</th>
                        <th className="text-left py-2 px-3">Fim</th>
                        <th className="text-left py-2 px-3">Tipo</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(template.slots || []).map((slot) => (
                        <tr key={slot.id} className="border-b">
                          <td className="py-2 px-3">{slot.slotOrder}</td>
                          <td className="py-2 px-3">{slot.startTime}</td>
                          <td className="py-2 px-3">{slot.endTime}</td>
                          <td className="py-2 px-3">
                            {slot.slotType === 'BREAK'
                              ? 'Intervalo'
                              : 'Aula'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="text-sm text-slate-500 border rounded-xl p-5">
                Nenhum modelo de horário cadastrado.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
