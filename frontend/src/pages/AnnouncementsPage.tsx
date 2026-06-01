import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';

type School = {
  id: string;
  name: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  visibilityType: string;
  priority: number;
  targetRoleType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  createdBy?: string | null;
  school?: School | null;
};

async function getAnnouncements() {
  const response = await api.get<Announcement[]>('/announcements');
  return response.data;
}

async function getSchools() {
  const response = await api.get<School[]>('/schools');
  return response.data;
}

async function createAnnouncement(data: any) {
  const response = await api.post<Announcement>('/announcements', data);
  return response.data;
}

async function updateAnnouncement(data: any) {
  const response = await api.put<Announcement>(`/announcements/${data.id}`, data);
  return response.data;
}

async function deleteAnnouncement(id: string) {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem limite';
  }

  return new Date(value).toLocaleDateString();
}

function toInputDate(value?: string | null) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function translateVisibility(value: string) {
  const labels: Record<string, string> = {
    ALL: 'Todos',
    SCHOOL: 'Escola especifica',
    DIRECTION: 'Direcao',
    TEACHERS: 'Professores',
  };

  return labels[value] ?? value;
}

function getErrorMessage(error: any, fallback: string) {
  const message =
    error?.response?.data?.message ?? error?.response?.data?.error ?? fallback;

  return Array.isArray(message) ? message.join('\n') : message;
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [visibilityType, setVisibilityType] = useState('ALL');
  const [targetRoleType, setTargetRoleType] = useState('');
  const [priority, setPriority] = useState(2);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  function resetForm() {
    setTitle('');
    setMessage('');
    setSchoolId('');
    setVisibilityType('ALL');
    setTargetRoleType('');
    setPriority(2);
    setStartDate('');
    setEndDate('');
    setEditingAnnouncement(null);
  }

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      alert(getErrorMessage(error, 'Erro ao publicar aviso.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAnnouncement,
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      alert(getErrorMessage(error, 'Erro ao atualizar aviso.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => {
      alert('Erro ao apagar aviso.');
    },
  });

  function getPayload() {
    return {
      title,
      message,
      schoolId: schoolId || null,
      visibilityType,
      targetRoleType: targetRoleType || null,
      priority,
      startDate: startDate ? `${startDate}T00:00:00.000Z` : null,
      endDate: endDate ? `${endDate}T23:59:59.000Z` : null,
      createdBy: 'Direcao',
    };
  }

  function handleSubmit() {
    if (editingAnnouncement) {
      updateMutation.mutate({
        id: editingAnnouncement.id,
        ...getPayload(),
      });
      return;
    }

    createMutation.mutate(getPayload());
  }

  function handleEdit(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setSchoolId(announcement.school?.id || '');
    setVisibilityType(announcement.visibilityType || 'ALL');
    setTargetRoleType(announcement.targetRoleType || '');
    setPriority(announcement.priority || 2);
    setStartDate(toInputDate(announcement.startDate));
    setEndDate(toInputDate(announcement.endDate));
  }

  function handleDelete(announcement: Announcement) {
    if (!confirm(`Apagar o aviso "${announcement.title}"?`)) {
      return;
    }

    deleteMutation.mutate(announcement.id);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="p-5">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {editingAnnouncement ? 'Editar aviso' : 'Novo aviso'}
            </h2>
            <p className="text-sm text-slate-500">
              {editingAnnouncement
                ? 'Atualize o comunicado selecionado.'
                : 'Publique comunicados para o quadro de mensagens.'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titulo</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                placeholder="Ex.: Reuniao pedagogica"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mensagem</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                placeholder="Escreva o comunicado..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Escola</label>
              <select
                value={schoolId}
                onChange={(event) => setSchoolId(event.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Todas as escolas</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Visibilidade</label>
              <select
                value={visibilityType}
                onChange={(event) => setVisibilityType(event.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="SCHOOL">Escola especifica</option>
                <option value="DIRECTION">Direcao</option>
                <option value="TEACHERS">Professores</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Grupo de funcao</label>
              <select
                value={targetRoleType}
                onChange={(event) => setTargetRoleType(event.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Todos os cargos</option>
                <option value="PROFESSOR">Professores</option>
                <option value="AUXILIAR">Auxiliares</option>
                <option value="SERVICOS_GERAIS">Servicos gerais</option>
                <option value="SECRETARIA">Secretaria</option>
                <option value="DIRETOR">Direcao</option>
                <option value="ORIENTADOR">Orientacao</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <select
                value={priority}
                onChange={(event) => setPriority(Number(event.target.value))}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
              >
                <option value={1}>Alta</option>
                <option value={2}>Media</option>
                <option value={3}>Baixa</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving
                ? 'Salvando...'
                : editingAnnouncement
                  ? 'Salvar alteracoes'
                  : 'Publicar aviso'}
            </button>

            {editingAnnouncement && (
              <button
                onClick={resetForm}
                disabled={saving}
                className="w-full rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar edicao
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="mb-5 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-lg font-semibold">Quadro de avisos</h2>
              <p className="text-sm text-slate-500">
                Comunicados publicados para teste.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
              Carregando avisos...
            </div>
          ) : (
            <div className="grid gap-3">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-xl border bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {announcement.message}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="rounded-lg border bg-white p-2 text-slate-700 hover:bg-slate-100"
                        title="Editar aviso"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement)}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg border border-red-200 bg-white p-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
                        title="Apagar aviso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1">
                      {translateVisibility(announcement.visibilityType)}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1">
                      Prioridade {announcement.priority === 1 ? 'alta' : announcement.priority === 2 ? 'media' : 'baixa'}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1">
                      {announcement.targetRoleType?.replace(/_/g, ' ') ?? 'Todos os cargos'}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1">
                      {announcement.school?.name ?? 'Todas as escolas'}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1">
                      {formatDate(announcement.startDate)} ate {formatDate(announcement.endDate)}
                    </span>
                  </div>
                </article>
              ))}

              {announcements.length === 0 && (
                <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                  Nenhum aviso publicado.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
