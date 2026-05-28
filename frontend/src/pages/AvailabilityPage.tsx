import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

type School = {
  id: string;
  name: string;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  slotOrder: number;
};

type Template = {
  id: string;
  name: string;
  schoolId: string;
  slots: Slot[];
};

const WEEKDAYS = [
  { key: 'MONDAY', label: 'Segunda' },
  { key: 'TUESDAY', label: 'Terça' },
  { key: 'WEDNESDAY', label: 'Quarta' },
  { key: 'THURSDAY', label: 'Quinta' },
  { key: 'FRIDAY', label: 'Sexta' },
];

async function getSchools() {
  const response = await api.get<School[]>('/schools');
  return response.data;
}

async function getTemplates() {
  const response = await api.get<Template[]>('/time-templates');
  return response.data;
}

async function getAvailability(
  schoolId: string,
  weekday: string,
  timeSlotId: string,
) {
  const response = await api.get('/availability', {
    params: {
      schoolId,
      weekday,
      timeSlotId,
    },
  });

  return response.data;
}

export default function AvailabilityPage() {
  const [schoolId, setSchoolId] = useState('');
  const [weekday, setWeekday] = useState('MONDAY');
  const [templateId, setTemplateId] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['time-templates'],
    queryFn: getTemplates,
  });

  const schoolTemplates = useMemo(() => {
    return templates.filter(
      (template) => !schoolId || template.schoolId === schoolId,
    );
  }, [templates, schoolId]);

  const selectedTemplate =
    schoolTemplates.find((item) => item.id === templateId) ||
    schoolTemplates[0];

  const slots = selectedTemplate?.slots || [];

  const {
    data: availability = [],
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['availability', schoolId, weekday, timeSlotId],
    queryFn: () =>
      getAvailability(schoolId, weekday, timeSlotId),
    enabled: false,
  });

  function handleSearch() {
    if (!schoolId || !timeSlotId) {
      alert('Selecione escola e horário.');
      return;
    }

    refetch();
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">
            Disponibilidade / Substituição
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Consulte os melhores substitutos por unidade e horário.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">
              Escola / CEIM
            </label>

            <select
              value={schoolId}
              onChange={(e) => {
                setSchoolId(e.target.value);
                setTemplateId('');
                setTimeSlotId('');
              }}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>

              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Dia
            </label>

            <select
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              {WEEKDAYS.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Modelo
            </label>

            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setTimeSlotId('');
              }}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              {schoolTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Horário
            </label>

            <select
              value={timeSlotId}
              onChange={(e) => setTimeSlotId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>

              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.startTime} - {slot.endTime}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm mb-6"
        >
          {isFetching
            ? 'Consultando...'
            : 'Consultar disponibilidade'}
        </button>

        <div className="flex gap-3 text-xs mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border"></div>
            Melhor substituto
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border"></div>
            Auxiliar / apoio
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border"></div>
            Fallback gestão
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-100 border"></div>
            Indisponível
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">
                  Servidor
                </th>

                <th className="text-left py-3">
                  Função
                </th>

                <th className="text-left py-3">
                  Status
                </th>

                <th className="text-left py-3">
                  Substitui?
                </th>

                <th className="text-left py-3">
                  Prioridade
                </th>

                <th className="text-left py-3">
                  Motivo
                </th>
              </tr>
            </thead>

            <tbody>
              {availability.map((item: any) => (
                <tr
                  key={item.employeeId}
                  className={`border-b ${
                    item.priority <= 2
                      ? 'bg-green-50'
                      : item.priority === 3
                      ? 'bg-yellow-50'
                      : item.priority <= 5
                      ? 'bg-orange-50'
                      : 'bg-slate-50'
                  }`}
                >
                  <td className="py-3 font-medium">
                    {item.name}
                  </td>

                  <td className="py-3">
                    {item.roleType?.replace(/_/g, ' ')}
                  </td>

                  <td className="py-3">
                    {item.status}
                  </td>

                  <td className="py-3">
                    {item.canSubstitute ? 'Sim' : 'Não'}
                  </td>

                  <td className="py-3">
                    {item.priority}
                  </td>

                  <td className="py-3 text-sm">
                    {item.reason}
                  </td>
                </tr>
              ))}

              {availability.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-500"
                  >
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
