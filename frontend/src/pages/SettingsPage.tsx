import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type SystemSettings = {
  substitutionAcceptanceTimeoutMinutes: number;
  municipalityName: string;
};

type AccessUser = {
  id: string;
  name: string;
  roleType?: string;
  loginEmail?: string | null;
  hasUser: boolean;
  accessProfile: string;
  school?: {
    name: string;
  } | null;
};

const ACCESS_LABELS: Record<string, string> = {
  SECRETARIA: 'Secretaria',
  DIRETOR: 'Direcao',
  ORIENTADOR: 'Orientador',
  SERVIDOR: 'Servidor',
};

async function getSettings() {
  const response = await api.get<SystemSettings>('/settings');
  return response.data;
}

async function updateSettings(data: SystemSettings) {
  const response = await api.put<SystemSettings>('/settings', data);
  return response.data;
}

async function getAccessUsers() {
  const response = await api.get<AccessUser[]>('/settings/access');
  return response.data;
}

async function updateAccess(data: { employeeId: string; accessProfile: string }) {
  const response = await api.put<AccessUser[]>(
    `/settings/access/${data.employeeId}`,
    {
      accessProfile: data.accessProfile,
    },
  );
  return response.data;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [substitutionAcceptanceTimeoutMinutes, setSubstitutionAcceptanceTimeoutMinutes] =
    useState(30);
  const [municipalityName, setMunicipalityName] = useState('Prefeitura de Pomerode');

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: accessUsers = [], isLoading: accessLoading } = useQuery({
    queryKey: ['settings-access'],
    queryFn: getAccessUsers,
  });

  useEffect(() => {
    if (settings) {
      setSubstitutionAcceptanceTimeoutMinutes(
        settings.substitutionAcceptanceTimeoutMinutes,
      );
      setMunicipalityName(settings.municipalityName || 'Prefeitura de Pomerode');
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async () => {
      alert('Configuracoes salvas com sucesso.');
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar configuracoes.');
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: updateAccess,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings-access'] });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar acesso.');
    },
  });

  function handleSave() {
    updateMutation.mutate({
      substitutionAcceptanceTimeoutMinutes,
      municipalityName,
    });
  }

  return (
    <section className="p-5 space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Configuracoes</h2>
          <p className="text-sm text-slate-500">
            Ajustes operacionais do fluxo de substituicoes.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
            Carregando configuracoes...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Nao foi possivel carregar as configuracoes.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="max-w-xl space-y-5">
            <div>
              <label className="text-sm font-medium">
                Prefeitura configurada
              </label>
              <input
                value={municipalityName}
                onChange={(event) => setMunicipalityName(event.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                placeholder="Prefeitura de Pomerode"
              />
              <p className="mt-2 text-xs text-slate-500">
                Este nome aparece no rodape do menu lateral e identifica o
                ambiente configurado.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">
                Tempo para aceite automatico da substituicao
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={substitutionAcceptanceTimeoutMinutes}
                  onChange={(event) =>
                    setSubstitutionAcceptanceTimeoutMinutes(Number(event.target.value))
                  }
                  className="w-40 border rounded-xl px-3 py-2 text-sm"
                />
                <span className="text-sm text-slate-500">minutos</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Se o aceite nao for registrado dentro desse prazo, o sistema
                aceitara automaticamente a substituicao quando a API for
                consultada.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar configuracoes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Controle de acessos</h2>
          <p className="text-sm text-slate-500">
            Defina o perfil de cada servidor cadastrado.
          </p>
        </div>

        {accessLoading ? (
          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
            Carregando acessos...
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Servidor</th>
                  <th className="text-left py-3">Escola</th>
                  <th className="text-left py-3">Login</th>
                  <th className="text-left py-3">Perfil de acesso</th>
                </tr>
              </thead>
              <tbody>
                {accessUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.roleType}</div>
                    </td>
                    <td className="py-3">{user.school?.name ?? '-'}</td>
                    <td className="py-3">{user.loginEmail ?? 'Sem login gerado'}</td>
                    <td className="py-3">
                      <select
                        value={user.accessProfile}
                        disabled={!user.hasUser || updateAccessMutation.isPending}
                        onChange={(event) =>
                          updateAccessMutation.mutate({
                            employeeId: user.id,
                            accessProfile: event.target.value,
                          })
                        }
                        className="w-48 rounded-xl border px-3 py-2 text-sm disabled:bg-slate-100"
                      >
                        {Object.entries(ACCESS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}

                {accessUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Nenhum servidor cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
