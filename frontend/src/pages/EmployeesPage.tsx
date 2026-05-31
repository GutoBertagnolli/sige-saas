import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

type School = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  roleType?: string;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  loginEmail?: string | null;
  initialPassword?: string | null;
  active: boolean;
  school?: School | null;
  user?: {
    email: string;
    role?: {
      name: string;
    } | null;
  } | null;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';

async function getEmployees() {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
}

async function getSchools() {
  const response = await api.get<School[]>('/schools');
  return response.data;
}

async function saveEmployee(data: {
  id?: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  schoolId?: string;
  roleType?: string;
}) {
  if (data.id) {
    const response = await api.put(`/employees/${data.id}`, data);
    return response.data;
  }

  const response = await api.post('/employees', {
    tenantId: TENANT_ID,
    ...data,
  });

  return response.data;
}

async function deleteEmployee(id: string) {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
}

async function generateEmployeeAccess(id: string) {
  const response = await api.post<Employee>(`/employees/${id}/access`);
  return response.data;
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [roleType, setRoleType] = useState('PROFESSOR');
  const [search, setSearch] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const saveMutation = useMutation({
    mutationFn: saveEmployee,
    onSuccess: async (savedEmployee) => {
      if (!editingEmployee) {
        setCreatedCredentials(savedEmployee);
      }
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
    onError: () => {
      alert('Erro ao salvar servidor.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => {
      alert('Erro ao excluir servidor.');
    },
  });

  const generateAccessMutation = useMutation({
    mutationFn: generateEmployeeAccess,
    onSuccess: async (employee) => {
      setCreatedCredentials(employee);
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => {
      alert('Erro ao gerar acesso do servidor.');
    },
  });

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setCreatedCredentials(null);
    setEditingEmployee(null);
    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
    setSchoolId('');
    setRoleType('PROFESSOR');
    setModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setName(employee.name || '');
    setCpf(employee.cpf || '');
    setEmail(employee.email || '');
    setPhone(employee.phone || '');
    setSchoolId(employee.school?.id || '');
    setRoleType(employee.roleType || 'PROFESSOR');    
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEmployee(null);
    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
    setSchoolId('');
    setRoleType('PROFESSOR');  
}

  function handleSave() {
    if (!name.trim()) {
      alert('Informe o nome do servidor.');
      return;
    }

    saveMutation.mutate({
      id: editingEmployee?.id,
      name,
      cpf,
      email,
      phone,
      roleType,
      schoolId: schoolId || undefined,
    });
  }

  function handleDelete(employee: Employee) {
    const confirmed = confirm(
      `Deseja realmente excluir/inativar "${employee.name}"?`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(employee.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Servidores</h2>
            <p className="text-sm text-slate-500">
              Cadastro de professores, auxiliares, orientadores e demais servidores.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-800"
          >
            Novo servidor
          </button>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Buscar servidor..."
          />
        </div>

        {createdCredentials && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm">
            <div className="font-semibold text-green-900">
              Acesso gerado para {createdCredentials.name}
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div>
                <span className="text-green-700">Login: </span>
                <span className="font-mono">{createdCredentials.loginEmail}</span>
              </div>
              <div>
                <span className="text-green-700">Senha inicial: </span>
                <span className="font-mono">{createdCredentials.initialPassword}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-700">
              Guarde estes dados para entregar ao servidor. O envio por WhatsApp/e-mail ficará para a próxima etapa.
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Nome</th>
                  <th className="text-left py-3">CPF</th>
                  <th className="text-left py-3">Escola</th>
                  <th className="text-left py-3">Função</th>
                  <th className="text-left py-3">Telefone</th>
                  <th className="text-left py-3">E-mail</th>
                  <th className="text-left py-3">Login</th>
                  <th className="text-left py-3">Senha inicial</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b">
                    <td className="py-3">{employee.name}</td>
                    <td className="py-3">{employee.cpf || '-'}</td>
                    <td className="py-3">{employee.school?.name || '-'}</td>
                    <td className="py-3">
		    {employee.roleType === 'SERVICOS_GERAIS' ? 'Serviços Gerais' : employee.roleType?.replace(/_/g, ' ') || 'PROFESSOR'}
</td>
                    <td className="py-3">{employee.phone || '-'}</td>
                    <td className="py-3">{employee.email || '-'}</td>
                    <td className="py-3">{employee.loginEmail || employee.user?.email || '-'}</td>
                    <td className="py-3 font-mono">{employee.initialPassword || '-'}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        {(!employee.loginEmail || !employee.initialPassword) && (
                          <button
                            className="px-3 py-1.5 rounded-lg border border-green-200 text-green-700 text-xs hover:bg-green-50 disabled:opacity-60"
                            disabled={generateAccessMutation.isPending}
                            onClick={() => generateAccessMutation.mutate(employee.id)}
                          >
                            Gerar acesso
                          </button>
                        )}

                        <button
                          className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-50"
                          onClick={() => openEditModal(employee)}
                        >
                          Editar
                        </button>

                        <button
                          className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-50"
			onClick={() => navigate(`/servidores/${employee.id}/planner`)}
                        >
                          Planner
                        </button>

                        <button
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50"
                          onClick={() => handleDelete(employee)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500">
                      Nenhum servidor encontrado.
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
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold mb-1">
              {editingEmployee ? 'Editar servidor' : 'Novo servidor'}
            </h3>

            <p className="text-sm text-slate-500 mb-5">
              Informe os dados básicos do servidor.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Nome completo *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="text-sm font-medium">CPF</label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefone / WhatsApp</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="(47) 99999-9999"
                />
              </div>

              <div>
                <label className="text-sm font-medium">E-mail</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="servidor@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Escola principal</label>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
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
  <label className="text-sm font-medium">Função / Cargo</label>

  <select
    value={roleType}
    onChange={(e) => setRoleType(e.target.value)}
    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
  >
    <option value="PROFESSOR">Professor</option>
    <option value="AUXILIAR">Auxiliar</option>
    <option value="ORIENTADOR">Orientador</option>
    <option value="DIRETOR">Diretor</option>
    <option value="SECRETARIA">Secretaria</option>
    <option value="SERVICOS_GERAIS">Serviços Gerais</option>
  </select>
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
