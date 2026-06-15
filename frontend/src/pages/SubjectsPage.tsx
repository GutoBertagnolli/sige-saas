import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type Subject = {
  id: string;
  name: string;
  color?: string | null;
  active: boolean;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';

async function getSubjects() {
  const response = await api.get<Subject[]>('/subjects');
  return response.data;
}

async function saveSubject(data: {
  id?: string;
  name: string;
  color?: string;
}) {
  if (data.id) {
    const response = await api.put(`/subjects/${data.id}`, data);
    return response.data;
  }

  const response = await api.post('/subjects', {
    tenantId: TENANT_ID,
    name: data.name,
    color: data.color,
  });

  return response.data;
}

async function deleteSubject(id: string) {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
}

export default function SubjectsPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [search, setSearch] = useState('');

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });

  const saveMutation = useMutation({
    mutationFn: saveSubject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      closeModal();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar disciplina.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao excluir disciplina.');
    },
  });

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setEditingSubject(null);
    setName('');
    setColor('#2563eb');
    setModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubject(subject);
    setName(subject.name);
    setColor(subject.color || '#2563eb');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSubject(null);
    setName('');
    setColor('#2563eb');
  }

  function handleSave() {
    if (!name.trim()) {
      alert('Informe o nome da disciplina.');
      return;
    }

    saveMutation.mutate({
      id: editingSubject?.id,
      name: name.trim(),
      color,
    });
  }

  function handleDelete(subject: Subject) {
    const confirmed = confirm(`Deseja realmente excluir/inativar "${subject.name}"?`);

    if (!confirmed) return;

    deleteMutation.mutate(subject.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Disciplinas</h2>
            <p className="text-sm text-slate-500">
              Cadastro padronizado das disciplinas lecionadas pelos professores.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-800"
          >
            Nova disciplina
          </button>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full md:w-96 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Buscar disciplina..."
          />
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Disciplina</th>
                  <th className="text-left py-3">Cor</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b">
                    <td className="py-3 font-medium">{subject.name}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: subject.color || '#e2e8f0' }}
                        />
                        {subject.color || '-'}
                      </span>
                    </td>
                    <td className="py-3">{subject.active ? 'Ativa' : 'Inativa'}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(subject)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Nenhuma disciplina encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-1">
              {editingSubject ? 'Editar disciplina' : 'Nova disciplina'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Informe o nome padronizado que será usado nos cadastros e relatórios.
            </p>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Ex.: Matemática"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-10 w-14 rounded-lg border bg-white p-1"
                  />
                  <input
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="#2563eb"
                  />
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
