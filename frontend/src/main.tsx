import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import AbsencesPage from './pages/AbsencesPage';
import SubstitutionsPage from './pages/SubstitutionsPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeePlannerPage from './pages/EmployeePlannerPage';
import TimeTemplatesPage from './pages/TimeTemplatesPage';
import ClassesPage from './pages/ClassesPage';
import SchoolsPage from './pages/SchoolsPage';
import SettingsPage from './pages/SettingsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PortalPage from './pages/PortalPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SubjectsPage from './pages/SubjectsPage';
import LayoutPreviewPage from './pages/LayoutPreviewPage';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalendarDays,
  Camera,
  ChevronDown,
  Clock,
  GraduationCap,
  KeyRound,
  LogOut,
  Menu,
  Megaphone,
  School,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import './index.css';
import sigeLogoSimple from './assets/sige-logo-simple.png';
import sigeLogoWhite from './assets/sige-logo-white.png';
import { APP_VERSION } from './version';
import { api, clearAuthToken, setAuthToken } from './services/api';

const baseMenu = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Mensagens', path: '/mensagens' },
  { label: 'Escolas', path: '/escolas' },
  { label: 'Turmas', path: '/turmas' },
  { label: 'Horários', path: '/horarios' },
  { label: 'Disciplinas', path: '/disciplinas' },
  { label: 'Servidores', path: '/servidores' },
  { label: 'Afastamentos', path: '/afastamentos' },
  { label: 'Substituições', path: '/substituicoes' },
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Previa layout', path: '/preview-layout' },
  { label: 'Configurações', path: '/configuracoes' },
];

const cards = [
  { title: 'Substituições pendentes', value: '0', icon: Clock },
  { title: 'Afastamentos hoje', value: '0', icon: CalendarDays },
  { title: 'Escolas ativas', value: '1', icon: School },
  { title: 'Servidores cadastrados', value: '0', icon: Users },
];

const DASHBOARD_POPUP_KEY = 'sige_show_dashboard_popups';

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terca-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sabado',
  SUNDAY: 'Domingo',
};

type DashboardAnnouncement = {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  priority?: number;
  startDate?: string | null;
  endDate?: string | null;
  createdBy?: string | null;
  school?: {
    name: string;
  } | null;
};

type DashboardSchool = {
  id: string;
  active?: boolean;
};

type DashboardEmployee = {
  id: string;
  active?: boolean;
  name: string;
};

type DashboardAbsence = {
  id: string;
  startDate: string;
  endDate: string;
  status?: string;
  employee?: {
    name: string;
  } | null;
};

type DashboardSubstitution = {
  id: string;
  weekday?: string | null;
  status: string;
  absence?: {
    startDate: string;
    endDate: string;
    employee?: {
      name: string;
    } | null;
  } | null;
  substituteTeacher?: {
    name: string;
  } | null;
  timeSlot?: {
    startTime: string;
    endTime: string;
  } | null;
};

type SystemSettings = {
  substitutionAcceptanceTimeoutMinutes: number;
  municipalityName: string;
};

type AuthEmployee = {
  id: string;
  name: string;
  roleType?: string;
  school?: {
    name: string;
  } | null;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  role?: string | null;
  employee?: AuthEmployee | null;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

const ADMIN_SESSION_KEY = 'sige_admin_session';
const ADMIN_ROLES = ['SECRETARIA', 'DIRETOR', 'ORIENTADOR', 'ADMIN', 'ADMINISTRADOR'];

async function getActiveAnnouncements() {
  const response = await api.get<DashboardAnnouncement[]>('/announcements/active');
  return response.data;
}

async function getDashboardSchools() {
  const response = await api.get<DashboardSchool[]>('/schools');
  return response.data;
}

async function getDashboardEmployees() {
  const response = await api.get<DashboardEmployee[]>('/employees');
  return response.data;
}

async function getDashboardAbsences() {
  const response = await api.get<DashboardAbsence[]>('/absences');
  return response.data;
}

async function getDashboardSubstitutions() {
  const response = await api.get<DashboardSubstitution[]>('/substitutions');
  return response.data;
}

async function getSystemSettings() {
  const response = await api.get<SystemSettings>('/settings');
  return response.data;
}

async function authenticate(data: { email: string; password: string }) {
  const response = await api.post<AuthSession>('/auth/login', {
    ...data,
    tenantSlug: 'suportiva',
  });

  return response.data;
}

async function getCurrentSession() {
  const response = await api.get<Omit<AuthSession, 'token'>>('/auth/me');
  return response.data;
}

async function updateProfile(data: { photoUrl: string | null }) {
  const response = await api.put<Omit<AuthSession, 'token'>>('/auth/profile', data);
  return response.data;
}

const PROFILE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PROFILE_PHOTO_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const PROFILE_PHOTO_MAX_SIZE = 8 * 1024 * 1024;
const PROFILE_PHOTO_MAX_DIMENSION = 480;
const PROFILE_PHOTO_PREVIEW_SIZE = 240;

function isSupportedProfilePhoto(file: File) {
  return PROFILE_PHOTO_TYPES.has(file.type) || PROFILE_PHOTO_EXTENSIONS.test(file.name);
}

function readProfilePhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível ler a imagem. Use JPG, PNG ou WebP.'));
    image.src = source;
  });
}

async function cropProfilePhoto(
  source: string,
  zoom: number,
  offset: { x: number; y: number },
) {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Não foi possível preparar a imagem.');
  }

  canvas.width = PROFILE_PHOTO_MAX_DIMENSION;
  canvas.height = PROFILE_PHOTO_MAX_DIMENSION;

  const coverScale =
    Math.max(
      PROFILE_PHOTO_MAX_DIMENSION / image.width,
      PROFILE_PHOTO_MAX_DIMENSION / image.height,
    ) * zoom;
  const width = image.width * coverScale;
  const height = image.height * coverScale;
  const previewToOutput = PROFILE_PHOTO_MAX_DIMENSION / PROFILE_PHOTO_PREVIEW_SIZE;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    (PROFILE_PHOTO_MAX_DIMENSION - width) / 2 + offset.x * previewToOutput,
    (PROFILE_PHOTO_MAX_DIMENSION - height) / 2 + offset.y * previewToOutput,
    width,
    height,
  );

  return canvas.toDataURL('image/jpeg', 0.82);
}

async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  await api.put('/auth/password', data);
}

function normalizeRole(user: AuthUser) {
  return String(user.role || user.employee?.roleType || '').toUpperCase();
}

function canAccessAdmin(user: AuthUser) {
  return ADMIN_ROLES.includes(normalizeRole(user));
}

function canViewAuditLogs(user: AuthUser) {
  return ['SECRETARIA', 'ADMIN', 'ADMINISTRADOR'].includes(normalizeRole(user));
}

function Layout({
  user,
  onLogout,
  onUserUpdate,
}: {
  user: AuthUser;
  onLogout: () => void;
  onUserUpdate: (user: AuthUser) => void;
}) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSystemSettings,
  });
  const municipalityName = settings?.municipalityName || 'Prefeitura de Pomerode';
  const menu = React.useMemo(
    () =>
      canViewAuditLogs(user)
        ? [...baseMenu, { label: 'Logs', path: '/logs' }]
        : baseMenu,
    [user],
  );
  const current = menu.find((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen flex bg-slate-50 print:block print:bg-white">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col p-5 print:hidden">
        <div className="mb-8">
          <img
            src={sigeLogoWhite}
            alt="SIGE"
            className="h-7 w-auto object-contain"
          />
          <div className="text-xs text-slate-300">
            Sistema Integrado de Gestao Educacional
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {menu.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                  active
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 pt-4 text-xs text-slate-300">
          {municipalityName}
        </div>
      </aside>
      <div className="fixed bottom-2 left-4 z-40 rounded-md bg-slate-900/85 px-2 py-1 text-xs text-white shadow-sm print:hidden">
        {municipalityName}
      </div>

      <main className="flex-1 flex min-h-screen min-w-0 flex-col print:block print:min-h-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-white px-4 py-3 md:px-5 md:py-4 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border text-slate-700 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold md:text-xl">
                {current?.label || 'SIGE'}
              </h1>
              <p className="hidden text-sm text-slate-500 sm:block">
                Fundação inicial do SIGE by SUPORTIVA
              </p>
            </div>
          </div>
          <UserMenu user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Fechar menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-slate-900 p-5 text-white shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <img
                    src={sigeLogoWhite}
                    alt="SIGE"
                    className="h-7 w-auto object-contain"
                  />
                  <div className="mt-1 text-xs text-slate-300">
                    Sistema Integrado de Gestao Educacional
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-slate-700 text-slate-200"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-auto">
                {menu.map((item) => {
                  const active = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block w-full rounded-xl px-3 py-3 text-left text-sm transition ${
                        active
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-700 pt-4 text-xs text-slate-300">
                {municipalityName}
              </div>
            </aside>
          </div>
        )}

        <div className="flex-1">
        <Routes>
          <Route path="/servidores/:employeeId/planner" element={<EmployeePlannerPage />} />
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/mensagens" element={<AnnouncementsPage />} />
  	  <Route path="/escolas" element={<SchoolsPage />} />          
          <Route path="/turmas" element={<ClassesPage />} />
          <Route path="/horarios" element={<TimeTemplatesPage />} />
          <Route path="/disciplinas" element={<SubjectsPage />} />
          <Route path="/materias" element={<Navigate to="/disciplinas" replace />} />
          <Route path="/servidores" element={<EmployeesPage />} />
	  <Route path="/afastamentos" element={<AbsencesPage />} />          
          <Route path="/substituicoes" element={<SubstitutionsPage />} />
          <Route path="/relatorios" element={<ReportsPage user={user} />} />
          <Route path="/preview-layout" element={<LayoutPreviewPage />} />
          {canViewAuditLogs(user) && <Route path="/logs" element={<AuditLogsPage />} />}
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </div>

        <footer className="border-t bg-white px-5 py-3 text-center text-xs text-slate-500 print:hidden">
          © 2026 SUPORTIVA LTDA. Todos os direitos reservados. Metodologia, fluxos operacionais e sistema protegidos pela legislação de direitos autorais e propriedade intelectual.
        </footer>
      </main>
    </div>
  );
}

function userInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function UserMenu({
  user,
  onLogout,
  onUserUpdate,
}: {
  user: AuthUser;
  onLogout: () => void;
  onUserUpdate: (user: AuthUser) => void;
}) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right text-xs text-slate-500">
        <div>sige.suportiva.org</div>
        <div>Versao {APP_VERSION}</div>
      </div>

      <div className="relative group">
        <button className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 text-left shadow-sm hover:bg-slate-50">
          <Avatar user={user} />
          <div className="hidden md:block min-w-0">
            <div className="max-w-40 truncate text-sm font-medium text-slate-900">{user.name}</div>
            <div className="max-w-40 truncate text-xs text-slate-500">{user.email}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>

        <div className="invisible absolute right-0 z-50 w-64 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
          <div className="rounded-xl border bg-white p-2 text-sm shadow-lg">
            <div className="border-b px-3 py-2">
              <div className="font-medium text-slate-900">{user.name}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>

            <button
              onClick={() => setProfileOpen(true)}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
            >
              <Camera className="h-4 w-4" />
              Alterar foto
            </button>
            <button
              onClick={() => setPasswordOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
            >
              <KeyRound className="h-4 w-4" />
              Alterar senha
            </button>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {profileOpen && (
        <ProfilePhotoModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onUserUpdate={onUserUpdate}
        />
      )}
      {passwordOpen && <PasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}

function Avatar({ user }: { user: AuthUser }) {
  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt={user.name}
        className="h-10 w-10 rounded-full border object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 text-sm font-semibold text-slate-700">
      {userInitials(user.name)}
    </div>
  );
}

function ProfilePhotoModal({
  user,
  onClose,
  onUserUpdate,
}: {
  user: AuthUser;
  onClose: () => void;
  onUserUpdate: (user: AuthUser) => void;
}) {
  const [photoUrl, setPhotoUrl] = React.useState(user.photoUrl ?? '');
  const [photoSource, setPhotoSource] = React.useState('');
  const [photoDimensions, setPhotoDimensions] = React.useState({ width: 1, height: 1 });
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = React.useState<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [loadingPhoto, setLoadingPhoto] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleFile(file?: File) {
    if (!file) return;

    setError('');

    if (!isSupportedProfilePhoto(file)) {
      setError('Use uma foto em JPG, PNG ou WebP. O formato HEIC do iPhone precisa ser convertido antes.');
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      setError('A foto deve ter no máximo 8 MB.');
      return;
    }

    setLoadingPhoto(true);

    try {
      const source = await readProfilePhoto(file);
      const image = await loadImage(source);

      setPhotoSource(source);
      setPhotoDimensions({ width: image.width, height: image.height });
      setPhotoUrl('');
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch (error: any) {
      setError(error?.message ?? 'Não foi possível preparar a foto.');
    } finally {
      setLoadingPhoto(false);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;

    setOffset({
      x: dragStart.offsetX + event.clientX - dragStart.pointerX,
      y: dragStart.offsetY + event.clientY - dragStart.pointerY,
    });
  }

  const previewCoverScale = Math.max(
    PROFILE_PHOTO_PREVIEW_SIZE / photoDimensions.width,
    PROFILE_PHOTO_PREVIEW_SIZE / photoDimensions.height,
  );
  const previewImageWidth = photoDimensions.width * previewCoverScale;
  const previewImageHeight = photoDimensions.height * previewCoverScale;

  async function save() {
    setSaving(true);
    setError('');

    try {
      const finalPhotoUrl = photoSource
        ? await cropProfilePhoto(photoSource, zoom, offset)
        : photoUrl || null;
      const session = await updateProfile({ photoUrl: finalPhotoUrl });
      onUserUpdate(session.user);
      onClose();
    } catch (error: any) {
      setError(error?.response?.data?.message ?? error?.message ?? 'Erro ao atualizar foto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Alterar foto" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {photoSource ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative overflow-hidden rounded-full border bg-slate-100 shadow-inner touch-none"
                style={{
                  width: PROFILE_PHOTO_PREVIEW_SIZE,
                  height: PROFILE_PHOTO_PREVIEW_SIZE,
                }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDragStart({
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                    offsetX: offset.x,
                    offsetY: offset.y,
                  });
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDragStart(null)}
                onPointerCancel={() => setDragStart(null)}
              >
                <img
                  src={photoSource}
                  alt={user.name}
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: previewImageWidth,
                    height: previewImageHeight,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  }}
                />
              </div>
              <div className="w-full max-w-60">
                <label className="text-xs font-medium text-slate-600">Zoom</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          ) : photoUrl ? (
            <img src={photoUrl} alt={user.name} className="h-24 w-24 rounded-full border object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-slate-100">
              <UserCircle className="h-10 w-10 text-slate-400" />
            </div>
          )}
          <div className="w-full min-w-0 space-y-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleFile(event.target.files?.[0])}
              disabled={loadingPhoto || saving}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            {photoSource && (
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="rounded-xl border px-3 py-2 text-sm text-slate-700"
              >
                Centralizar
              </button>
            )}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setPhotoUrl('');
              setPhotoSource('');
              setPhotoDimensions({ width: 1, height: 1 });
            }}
            className="rounded-xl border px-4 py-2 text-sm text-slate-700"
          >
            Remover foto
          </button>
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm text-slate-700">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || loadingPhoto}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? 'Salvando...' : loadingPhoto ? 'Preparando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('A confirmacao da senha nao confere.');
      return;
    }

    setSaving(true);

    try {
      await updatePassword({ currentPassword, newPassword });
      onClose();
      alert('Senha alterada com sucesso.');
    } catch (error: any) {
      setError(error?.response?.data?.message ?? 'Erro ao alterar senha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Alterar senha" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Senha atual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Nova senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            minLength={6}
            required
          />
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm text-slate-700">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar senha'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm text-slate-600">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored).user ?? null;
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
  });
  const [checkingSession, setCheckingSession] = React.useState(Boolean(user));

  React.useEffect(() => {
    if (!user) return;

    getCurrentSession()
      .then((session) => {
        if (!canAccessAdmin(session.user)) {
          handleLogout();
          return;
        }

        setUser(session.user);
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: session.user }));
      })
      .catch(() => {
        handleLogout();
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLogin(session: AuthSession) {
    setAuthToken(session.token);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: session.user }));
    sessionStorage.setItem(DASHBOARD_POPUP_KEY, '1');
    setUser(session.user);
  }

  function handleUserUpdate(updatedUser: AuthUser) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: updatedUser }));
    setUser(updatedUser);
  }

  function handleLogout() {
    clearAuthToken();
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(null);
    queryClient.clear();
  }

  if (checkingSession) {
    return (
      <section className="min-h-screen bg-slate-100 p-5 flex items-center justify-center">
        <div className="rounded-2xl border bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Restaurando sessao...
        </div>
      </section>
    );
  }

  return (
    <Routes>
      <Route path="/portal" element={<PortalPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/*"
        element={
          user ? (
            <Layout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: AuthSession) => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await authenticate({ email, password });

      if (!canAccessAdmin(session.user)) {
        clearAuthToken();
        setError('Este usuario deve acessar pelo Portal do servidor.');
        return;
      }

      onLogin(session);
    } catch (error: any) {
      setError(error?.response?.data?.message ?? 'Usuario ou senha invalidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-100 p-5 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div className="text-center">
          <img
            src={sigeLogoSimple}
            alt="SIGE"
            className="mx-auto h-9 w-auto object-contain"
          />
          <p className="mt-1 text-sm text-slate-500">
            Sistema Integrado de Gestao Educacional
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          Use o login e senha recebido por Email e/ou WhatsApp.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Login</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </section>
  );
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function isTodayBetween(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return start <= endOfToday() && end >= startOfToday();
}

function isAnnouncementExpired(announcement: DashboardAnnouncement) {
  if (!announcement.endDate) return false;

  return new Date(announcement.endDate).getTime() < Date.now();
}

function formatAnnouncementExpiredDate(announcement: DashboardAnnouncement) {
  if (!announcement.endDate) return '';

  return new Date(announcement.endDate).toLocaleDateString('pt-BR');
}

function formatDashboardSchedule(substitution: DashboardSubstitution) {
  const weekday = WEEKDAY_LABELS[String(substitution.weekday || '').toUpperCase()] || 'Hoje';
  const start = substitution.timeSlot?.startTime;
  const end = substitution.timeSlot?.endTime;

  if (!start || !end) return `${weekday} - horario nao informado`;
  return `${weekday} - ${start} - ${end}`;
}

function formatDashboardStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING_DIRECTOR: 'Pendente direcao',
    SENT_TO_TEACHER: 'Aguardando substituto',
    ACCEPTED: 'Aceito',
    DECLINED: 'Recusado',
    CANCELLED: 'Cancelado',
  };

  return labels[status] || status;
}

function DashboardHome() {
  const navigate = useNavigate();
  const [popupStep, setPopupStep] = React.useState<'none' | 'messages' | 'substitutions'>('none');
  const { data: announcements = [], isFetched: announcementsFetched } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: getActiveAnnouncements,
  });
  const { data: schools = [] } = useQuery({
    queryKey: ['dashboard', 'schools'],
    queryFn: getDashboardSchools,
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['dashboard', 'employees'],
    queryFn: getDashboardEmployees,
  });
  const { data: absences = [] } = useQuery({
    queryKey: ['dashboard', 'absences'],
    queryFn: getDashboardAbsences,
  });
  const { data: substitutions = [], isFetched: substitutionsFetched } = useQuery({
    queryKey: ['dashboard', 'substitutions'],
    queryFn: getDashboardSubstitutions,
  });

  const todayAbsences = absences.filter(
    (absence) => absence.status !== 'CANCELLED' && isTodayBetween(absence.startDate, absence.endDate),
  );
  const todaySubstitutions = substitutions.filter(
    (substitution) =>
      substitution.status !== 'CANCELLED' &&
      substitution.status !== 'DECLINED' &&
      isTodayBetween(substitution.absence?.startDate, substitution.absence?.endDate),
  );
  const pendingSubstitutions = substitutions.filter((substitution) =>
    ['PENDING_DIRECTOR', 'SENT_TO_TEACHER'].includes(substitution.status),
  );
  const activeSchools = schools.filter((school) => school.active !== false).length;
  const activeEmployees = employees.filter((employee) => employee.active !== false).length;
  const visibleAnnouncements = announcements.filter((announcement) => !isAnnouncementExpired(announcement));
  const sortedAnnouncements = [...visibleAnnouncements].sort((first, second) => {
    const firstExpired = isAnnouncementExpired(first) ? 1 : 0;
    const secondExpired = isAnnouncementExpired(second) ? 1 : 0;

    return (
      firstExpired - secondExpired ||
      (first.priority || 0) - (second.priority || 0) ||
      new Date(second.startDate || 0).getTime() - new Date(first.startDate || 0).getTime()
    );
  });
  const popupAnnouncements = sortedAnnouncements.filter(
    (announcement) => !isAnnouncementExpired(announcement),
  );

  const dashboardCards = [
    {
      title: 'Substituicoes pendentes',
      value: pendingSubstitutions.length,
      icon: Clock,
      path: '/substituicoes',
    },
    {
      title: 'Afastamentos hoje',
      value: todayAbsences.length,
      icon: CalendarDays,
      path: '/afastamentos',
    },
    {
      title: 'Escolas ativas',
      value: activeSchools,
      icon: School,
      path: '/escolas',
    },
    {
      title: 'Servidores cadastrados',
      value: activeEmployees,
      icon: Users,
      path: '/servidores',
    },
  ];

  React.useEffect(() => {
    if (sessionStorage.getItem(DASHBOARD_POPUP_KEY) !== '1') return;
    if (!announcementsFetched || !substitutionsFetched) return;

    if (popupAnnouncements.length > 0) {
      setPopupStep('messages');
      return;
    }

    if (todaySubstitutions.length > 0) {
      setPopupStep('substitutions');
      return;
    }

    sessionStorage.removeItem(DASHBOARD_POPUP_KEY);
    setPopupStep('none');
  }, [announcementsFetched, substitutionsFetched, popupAnnouncements.length, todaySubstitutions.length]);

  function closeMessagesPopup() {
    if (todaySubstitutions.length > 0) {
      setPopupStep('substitutions');
      return;
    }

    closeSubstitutionsPopup();
  }

  function closeSubstitutionsPopup() {
    sessionStorage.removeItem(DASHBOARD_POPUP_KEY);
    setPopupStep('none');
  }

  return (
    <>
      <section className="p-5 grid gap-4 md:grid-cols-4">
        {dashboardCards.map((Card) => (
          <button
            key={Card.title}
            type="button"
            onClick={() => navigate(Card.path)}
            className="bg-white rounded-2xl shadow-sm border p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <Card.icon className="w-5 h-5 text-slate-600" />
            <div className="mt-4 text-2xl font-bold">{Card.value}</div>
            <div className="text-sm text-slate-500">{Card.title}</div>
          </button>
        ))}
      </section>

      <section className="p-5 grid gap-4">
        <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-amber-950">
            <Megaphone className="w-5 h-5" />
            <h2 className="font-semibold">Quadro de mensagens</h2>
          </div>
          <div className="grid gap-3">
            {sortedAnnouncements.slice(0, 5).map((announcement) => {
              const expired = isAnnouncementExpired(announcement);

              return (
              <div
                key={announcement.id}
                className={`rounded-xl border p-4 text-sm text-slate-700 shadow-sm ${
                  expired
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-white'
                }`}
              >
                <div className="font-semibold text-slate-900">
                  {announcement.title}
                  {expired && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      Esta mensagem venceu em {formatAnnouncementExpiredDate(announcement)}
                    </span>
                  )}
                </div>
                <div className="mt-1 whitespace-pre-line break-words">{announcement.message}</div>
                {announcement.imageUrl && (
                  <img
                    src={announcement.imageUrl}
                    alt={announcement.title}
                    className="mt-3 max-h-80 w-full rounded-xl border bg-white object-contain"
                  />
                )}
                <div className="mt-2 text-xs text-slate-500">
                  {announcement.school?.name ?? 'Todas as escolas'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Publicado por {announcement.createdBy || 'Direcao'}
                </div>
              </div>
              );
            })}

            {sortedAnnouncements.length === 0 && (
              <div className="rounded-xl bg-white border border-amber-200 p-4 text-sm text-slate-600">
                Nenhum aviso publicado.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold">Substituicoes de hoje</h2>
          </div>
          <div className="grid gap-3">
            {todaySubstitutions.map((substitution) => (
              <div key={substitution.id} className="rounded-xl bg-slate-50 border p-4 text-sm">
                <div className="font-semibold text-slate-900">
                  {substitution.absence?.employee?.name || 'Servidor faltante nao informado'}
                </div>
                <div className="mt-1 text-slate-600">
                  Substituto: {substitution.substituteTeacher?.name || 'Nao definido'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {formatDashboardSchedule(substitution)} - {formatDashboardStatus(substitution.status)}
                </div>
              </div>
            ))}

            {todaySubstitutions.length === 0 && (
              <div className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600">
                Nenhuma substituicao programada para hoje.
              </div>
            )}
          </div>
        </div>
      </section>

      {popupStep === 'messages' && (
        <Modal title="Quadro de mensagens" onClose={closeMessagesPopup}>
          <div className="grid max-h-[60vh] gap-3 overflow-auto pr-1">
            {popupAnnouncements.map((announcement) => {
              const expired = isAnnouncementExpired(announcement);

              return (
              <div
                key={announcement.id}
                className={`rounded-xl border p-4 text-sm ${
                  expired
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="font-semibold text-slate-900">
                  {announcement.title}
                  {expired && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      Esta mensagem venceu em {formatAnnouncementExpiredDate(announcement)}
                    </span>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-line break-words text-slate-700">{announcement.message}</div>
                {announcement.imageUrl && (
                  <img
                    src={announcement.imageUrl}
                    alt={announcement.title}
                    className="mt-3 max-h-[45vh] w-full rounded-xl border bg-white object-contain"
                  />
                )}
                <div className="mt-3 text-xs text-slate-500">
                  {announcement.school?.name ?? 'Todas as escolas'} - Publicado por {announcement.createdBy || 'Direcao'}
                </div>
              </div>
              );
            })}

            {popupAnnouncements.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                Nenhuma mensagem disponivel.
              </div>
            )}
          </div>
        </Modal>
      )}

      {popupStep === 'substitutions' && (
        <Modal title="Substituicoes de hoje" onClose={closeSubstitutionsPopup}>
          <div className="grid max-h-[60vh] gap-3 overflow-auto pr-1">
            {todaySubstitutions.map((substitution) => (
              <div key={substitution.id} className="rounded-xl border bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-slate-900">
                  Faltante: {substitution.absence?.employee?.name || 'Nao informado'}
                </div>
                <div className="mt-1 text-slate-700">
                  Substituto: {substitution.substituteTeacher?.name || 'Nao definido'}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {formatDashboardSchedule(substitution)} - {formatDashboardStatus(substitution.status)}
                </div>
              </div>
            ))}

            {todaySubstitutions.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                Nenhuma substituicao programada para hoje.
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function Dashboard() {
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: getActiveAnnouncements,
  });

  return (
    <>
      <section className="p-5 grid gap-4 md:grid-cols-4">
        {cards.map((Card) => (
          <div
            key={Card.title}
            className="bg-white rounded-2xl shadow-sm border p-5"
          >
            <Card.icon className="w-5 h-5 text-slate-600" />
            <div className="mt-4 text-2xl font-bold">{Card.value}</div>
            <div className="text-sm text-slate-500">{Card.title}</div>
          </div>
        ))}
      </section>

      <section className="p-5 grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5" />
            <h2 className="font-semibold">Quadro de mensagens</h2>
          </div>
          <div className="grid gap-3">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600"
              >
                <div className="font-semibold text-slate-900">
                  {announcement.title}
                </div>
                <div className="mt-1 line-clamp-3">{announcement.message}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {announcement.school?.name ?? 'Todas as escolas'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Publicado por {announcement.createdBy || 'Direcao'}
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600">
                Nenhum aviso publicado.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5" />
            <h2 className="font-semibold">Horários padrão</h2>
          </div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>Matutino - Anos Iniciais</li>
            <li>Matutino - Anos Finais</li>
            <li>Vespertino - Anos Iniciais</li>
            <li>Vespertino - Anos Finais</li>
          </ul>
        </div>
      </section>
    </>
  );
}

function SimplePage({ title }: { title: string }) {
  return (
    <section className="p-5">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-slate-500">
          Módulo em construção. A próxima etapa será conectar esta tela à API.
        </p>
      </div>
    </section>
  );
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(

<React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
</React.StrictMode>
);
