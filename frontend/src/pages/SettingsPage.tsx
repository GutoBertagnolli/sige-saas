import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

type SystemSettings = {
  substitutionAcceptanceTimeoutMinutes: number;
};

async function getSettings() {
  const response = await api.get<SystemSettings>('/settings');
  return response.data;
}

async function updateSettings(data: SystemSettings) {
  const response = await api.put<SystemSettings>('/settings', data);
  return response.data;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [substitutionAcceptanceTimeoutMinutes, setSubstitutionAcceptanceTimeoutMinutes] =
    useState(30);

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (settings) {
      setSubstitutionAcceptanceTimeoutMinutes(
        settings.substitutionAcceptanceTimeoutMinutes,
      );
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async () => {
      alert('Configurações salvas com sucesso.');
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      await queryClient.invalidateQueries({ queryKey: ['absences'] });
      await queryClient.invalidateQueries({ queryKey: ['substitutions'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message ?? 'Erro ao salvar configurações.');
    },
  });

  function handleSave() {
    updateMutation.mutate({
      substitutionAcceptanceTimeoutMinutes,
    });
  }

  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Configurações</h2>
          <p className="text-sm text-slate-500">
            Ajustes operacionais do fluxo de substituições.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
            Carregando configurações...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar as configurações.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="max-w-xl space-y-5">
            <div>
              <label className="text-sm font-medium">
                Tempo para aceite automático da substituição
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
                Se o aceite não for registrado dentro desse prazo, o sistema
                aceitará automaticamente a substituição quando a API for
                consultada.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
