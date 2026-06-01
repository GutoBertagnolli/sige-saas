import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../services/api';

type School = {
  id: string;
  name: string;
};

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
  school?: School;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';

async function getTemplates() {
  const response = await api.get<TimeTemplate[]>('/time-templates');
  return response.data;
}

async function getSchools() {
  const response = await api.get<School[]>('/schools');
  return response.data;
}

async function saveTemplate(data: any) {
  if (data.id) {
    const response = await api.put(`/time-templates/${data.id}`, data);
    return response.data;
  }

  const response = await api.post('/time-templates', data);
  return response.data;
}

async function deleteTemplate(id: string) {
  const response = await api.delete(`/time-templates/${id}`);
  return response.data;
}

export default function TimeTemplatesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimeTemplate | null>(null);
  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [shift, setShift] = useState('MATUTINO');
  const [educationStage, setEducationStage] = useState('ANOS_INICIAIS');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['time-templates'],
    queryFn: getTemplates,
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const saveMutation = useMutation({
    mutationFn: saveTemplate,
    onSuccess: async () => {
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['time-templates'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar modelo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['time-templates'] });
    },
    onError: () => {
      alert('Erro ao excluir modelo.');
    },
  });

  function openCreateModal() {
    setEditingTemplate(null);
    setName('');
    setSchoolId(schools[0]?.id ?? '');
    setShift('MATUTINO');
    setEducationStage('ANOS_INICIAIS');
    setModalOpen(true);
  }

  function openEditModal(template: TimeTemplate) {
    setEditingTemplate(template);
    setName(template.name);
    setSchoolId(template.school?.id ?? '');
    setShift(template.shift);
    setEducationStage(template.educationStage);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTemplate(null);
    setName('');
    setSchoolId('');
    setShift('MATUTINO');
    setEducationStage('ANOS_INICIAIS');
  }

  function handleSave() {
    if (!name.trim()) {
      alert('Informe o nome do modelo.');
      return;
    }

    if (!schoolId && !editingTemplate) {
      alert('Selecione uma escola.');
      return;
    }

    saveMutation.mutate({
      id: editingTemplate?.id,
      tenantId: TENANT_ID,
      schoolId,
      name,
      shift,
      educationStage,
      slots: editingTemplate ? undefined : [],
    });
  }

  function handleDelete(template: TimeTemplate) {
    if (!confirm(`Excluir o modelo "${template.name}"?`)) {
      return;
    }

    deleteMutation.mutate(template.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Horarios</h2>
            <p className="text-sm text-slate-500">
              Modelos de horarios por escola, turno e etapa.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm"
          >
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
                      {template.school?.name || 'Escola'} - {template.shift} -{' '}
                      {template.educationStage}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(template)}
                      className="px-3 py-1.5 rounded-lg border text-xs bg-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs bg-white disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-sm bg-white rounded-xl overflow-hidden">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Ordem</th>
                        <th className="text-left py-2 px-3">Inicio</th>
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
                            {slot.slotType === 'BREAK' ? 'Intervalo' : 'Aula'}
                          </td>
                        </tr>
                      ))}

                      {(template.slots || []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 px-3 text-slate-500">
                            Nenhum horario cadastrado neste modelo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="text-sm text-slate-500 border rounded-xl p-5">
                Nenhum modelo de horario cadastrado.
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold mb-1">
              {editingTemplate ? 'Editar modelo' : 'Novo modelo'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Informe os dados principais do modelo de horario.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Escola</label>
                <select
                  value={schoolId}
                  onChange={(event) => setSchoolId(event.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                  disabled={Boolean(editingTemplate)}
                >
                  <option value="">Selecione</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Turno</label>
                  <select
                    value={shift}
                    onChange={(event) => setShift(event.target.value)}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="MATUTINO">Matutino</option>
                    <option value="VESPERTINO">Vespertino</option>
                    <option value="INTEGRAL">Integral</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Etapa</label>
                  <select
                    value={educationStage}
                    onChange={(event) => setEducationStage(event.target.value)}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="ANOS_INICIAIS">Anos iniciais</option>
                    <option value="ANOS_FINAIS">Anos finais</option>
                    <option value="CEIM">CEIM</option>
                    <option value="ENSINO_MEDIO">Ensino medio</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm border">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm bg-slate-900 text-white disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
