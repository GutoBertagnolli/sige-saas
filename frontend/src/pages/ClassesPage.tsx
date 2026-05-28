import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type School = {
  id: string;
  name: string;
};

type TimeTemplate = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  academicYear: number;
  shift: string;
  educationStage: string;
  active: boolean;
  school?: School;
  template?: TimeTemplate;
};

const TENANT_ID = 'd48a9959-685e-4dc7-8af4-a156e9cfa9ac';

const BASIC_GRADES = [
  'Pré',
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
];

const CEI_GRADES = [
  'Berçário 1',
  'Berçário 2',
  'Creche 2',
  'Creche 3',
  'Pré 1',
  'Pré 2',
];

const CLASS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getStageFromGrade(grade: string) {
  if (
    ['Pré', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'].includes(grade)
  ) {
    return 'ANOS_INICIAIS';
  }

  if (
    ['6º Ano', '7º Ano', '8º Ano', '9º Ano'].includes(grade)
  ) {
    return 'ANOS_FINAIS';
  }

  return 'CEIM';
}

async function getClasses() {
  const response = await api.get<ClassItem[]>('/classes');
  return response.data;
}

async function getSchools() {
  const response = await api.get<School[]>('/schools');
  return response.data;
}

async function getTemplates() {
  const response = await api.get<TimeTemplate[]>('/time-templates');
  return response.data;
}

async function saveClass(data: any) {
  if (data.id) {
    const response = await api.put(`/classes/${data.id}`, data);
    return response.data;
  }

  const response = await api.post('/classes', {
    tenantId: TENANT_ID,
    ...data,
  });

  return response.data;
}

async function deleteClass(id: string) {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
}

export default function ClassesPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [schoolType, setSchoolType] = useState('BASICA');
  const [grade, setGrade] = useState('1º Ano');
  const [classLetter, setClassLetter] = useState('A');

  const [schoolId, setSchoolId] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [shift, setShift] = useState('MATUTINO');
  const [templateId, setTemplateId] = useState('');
  const [search, setSearch] = useState('');

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['time-templates'],
    queryFn: getTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: saveClass,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['classes'],
      });

      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['classes'],
      });
    },
  });

  const filteredClasses = classes.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setEditingClass(null);
    setSchoolType('BASICA');
    setGrade('1º Ano');
    setClassLetter('A');
    setSchoolId('');
    setAcademicYear(new Date().getFullYear());
    setShift('MATUTINO');
    setTemplateId('');
    setModalOpen(true);
  }

  function openEditModal(item: ClassItem) {
    setEditingClass(item);
    setSchoolId(item.school?.id || '');
    setAcademicYear(item.academicYear);
    setShift(item.shift);
    setTemplateId(item.template?.id || '');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingClass(null);
  }

  function handleSave() {
    const generatedName = `${grade} ${classLetter}`;
    const generatedStage = getStageFromGrade(grade);

    saveMutation.mutate({
      id: editingClass?.id,
      name: generatedName,
      schoolId,
      academicYear,
      shift,
      educationStage: generatedStage,
      templateId,
    });
  }

  function handleDelete(item: ClassItem) {
    const confirmed = confirm(
      `Deseja realmente excluir/inativar "${item.name}"?`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(item.id);
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Turmas</h2>
            <p className="text-sm text-slate-500">
              Gerenciamento das turmas
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm"
          >
            Nova turma
          </button>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border rounded-xl px-3 py-2 text-sm"
            placeholder="Buscar turma..."
          />
        </div>

        {isLoading ? (
          <div>Carregando...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Turma</th>
                  <th className="text-left py-3">Escola</th>
                  <th className="text-left py-3">Ano</th>
                  <th className="text-left py-3">Período</th>
                  <th className="text-left py-3">Etapa</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredClasses.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.name}</td>
                    <td className="py-3">{item.school?.name || '-'}</td>
                    <td className="py-3">{item.academicYear}</td>
                    <td className="py-3">{item.shift}</td>
                    <td className="py-3">{item.educationStage}</td>

                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1 rounded-lg border text-xs"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          className="px-3 py-1 rounded-lg border border-red-200 text-red-700 text-xs"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredClasses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-slate-500"
                    >
                      Nenhuma turma encontrada.
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
              {editingClass ? 'Editar turma' : 'Nova turma'}
            </h3>

            <div className="grid gap-4 md:grid-cols-2 mt-5">
              <div>
                <label className="text-sm font-medium">
                  Tipo de unidade
                </label>

                <select
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="BASICA">Escola Básica</option>
                  <option value="CEI">CEI</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Nível / Série
                </label>

                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                >
                  {(schoolType === 'BASICA'
                    ? BASIC_GRADES
                    : CEI_GRADES
                  ).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Turma</label>

                <select
                  value={classLetter}
                  onChange={(e) => setClassLetter(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                >
                  {CLASS_LETTERS.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Nome gerado
                </label>

                <div className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-slate-50">
                  {grade} {classLetter}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Escola
                </label>

                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
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
                  Modelo de horário
                </label>

                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>

                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Ano letivo
                </label>

                <input
                  type="number"
                  value={academicYear}
                  onChange={(e) =>
                    setAcademicYear(Number(e.target.value))
                  }
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Período
                </label>

                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                  <option value="INTEGRAL">Integral</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border text-sm"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
