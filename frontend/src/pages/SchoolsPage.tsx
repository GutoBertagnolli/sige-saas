import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type School = {
  id: string;
  name: string;
  type: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';

async function getSchools() {
  const response = await api.get<School[]>('/schools');
  return response.data;
}

async function saveSchool(data: {
  id?: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  if (data.id) {
    const response = await api.put(`/schools/${data.id}`, data);
    return response.data;
  }

  const response = await api.post('/schools', {
    tenantId: TENANT_ID,
    name: data.name,
    type: data.type,
    address: data.address,
    phone: data.phone,
    email: data.email,
  });

  return response.data;
}

async function deleteSchool(id: string) {
  const response = await api.delete(`/schools/${id}`);
  return response.data;
}

export default function SchoolsPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('ESCOLA');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');

  const {
    data: schools = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const saveMutation = useMutation({
    mutationFn: saveSchool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schools'] });
      closeModal();
    },
    onError: () => {
      alert('Erro ao salvar escola.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: () => {
      alert('Erro ao excluir escola.');
    },
  });

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setEditingSchool(null);
    setName('');
    setType('ESCOLA');
    setAddress('');
    setPhone('');
    setEmail('');
    setModalOpen(true);
  }

  function openEditModal(school: School) {
    setEditingSchool(school);
    setName(school.name);
    setType(school.type || 'ESCOLA');
    setAddress(school.address || '');
    setPhone(school.phone || '');
    setEmail(school.email || '');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSchool(null);
    setName('');
    setType('ESCOLA');
    setAddress('');
    setPhone('');
    setEmail('');
  }

  function handleSave() {
    if (!name.trim()) {
      alert('Informe o nome da escola.');
      return;
    }

    saveMutation.mutate({
      id: editingSchool?.id,
      name,
      type,
      address,
      phone,
      email,
    });
  }

  function handleDelete(school: School) {
    const confirmed = confirm(
      `Deseja realmente excluir/inativar "${school.name}"?`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(school.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Escolas</h2>
            <p className="text-sm text-slate-500">
              Gerenciamento das unidades escolares
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-800"
          >
            Nova escola
          </button>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Buscar escola..."
          />
        </div>

        {isLoading && (
          <div className="text-sm text-slate-500">Carregando...</div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erro ao carregar escolas.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Nome</th>
                  <th className="text-left py-3">Tipo</th>
                  <th className="text-left py-3">Telefone</th>
                  <th className="text-left py-3">E-mail</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="border-b">
                    <td className="py-3">{school.name}</td>
                    <td className="py-3">{school.type}</td>
                    <td className="py-3">{school.phone || '-'}</td>
                    <td className="py-3">{school.email || '-'}</td>
                    <td className="py-3">
                      {school.active ? 'Ativa' : 'Inativa'}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(school)}
                          className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(school)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSchools.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-slate-500"
                    >
                      Nenhuma escola encontrada.
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
              {editingSchool ? 'Editar escola' : 'Nova escola'}
            </h3>

            <p className="text-sm text-slate-500 mb-5">
              {editingSchool
                ? 'Atualize os dados da unidade escolar.'
                : 'Cadastre uma nova unidade escolar.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Ex: E. B. M. Almirante Barroso"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="ESCOLA">Escola</option>
                  <option value="CEIM">CEIM</option>
                  <option value="CRECHE">Creche</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="POLO">Polo</option>
                  <option value="SECRETARIA">Secretaria</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Endereço</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Endereço da escola"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="(47) 0000-0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="escola@municipio.gov.br"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-sm border"
              >
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
