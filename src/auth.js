// ─────────────────────────────────────────────────────────────────────────────
// FROTA PRO — Auth & Permissions
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = "fp_session";
const USERS_KEY   = "fp_users";

// All configurable permissions for mechanic accounts
// Keys here MUST match what App.jsx passes to can()
export const ALL_PERMISSIONS = [
  { key: "canViewVehicles",        label: "Ver lista de veículos",           icon: "🚛" },
  { key: "canAddVehicles",         label: "Cadastrar novos veículos",         icon: "➕" },
  { key: "canEditVehicles",        label: "Editar dados do veículo",          icon: "✏️" },
  { key: "canDeleteVehicles",      label: "Remover veículos",                icon: "🗑️" },
  { key: "canRegisterMaintenance", label: "Registrar manutenções",            icon: "🔧" },
  { key: "canEditMaintenance",     label: "Editar manutenções existentes",    icon: "📝" },
  { key: "canDeleteMaintenance",   label: "Remover registros de manutenção",  icon: "❌" },
  { key: "canViewAlerts",          label: "Ver Central de Alertas",           icon: "🔔" },
  { key: "canViewReports",         label: "Acessar Relatórios",              icon: "📊" },
  { key: "canExportData",          label: "Exportar dados (Excel/PDF)",       icon: "⬇️" },
];

// Default permissions when creating a new mechanic account
export const DEFAULT_MECHANIC_PERMS = {
  canViewVehicles:        true,
  canAddVehicles:         false,
  canEditVehicles:        false,
  canDeleteVehicles:      false,
  canRegisterMaintenance: true,
  canEditMaintenance:     true,
  canDeleteMaintenance:   false,
  canViewAlerts:          true,
  canViewReports:         false,
  canExportData:          false,
};

// ── Storage helpers ──────────────────────────────────────────────────────────
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const load = (key, def) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? def; } catch { return def; } };

// ── Users store ──────────────────────────────────────────────────────────────
export const getUsers  = ()      => load(USERS_KEY, []);
export const saveUsers = (users) => save(USERS_KEY, users);

// Seed default admin on first run (plain text password for local use)
export const seedAdmin = () => {
  const users = getUsers();
  if (!users.find(u => u.role === "admin")) {
    saveUsers([{
      id:          "admin-001",
      name:        "Administrador",
      username:    "admin",
      password:    "admin123",
      role:        "admin",
      active:      true,
      permissions: {},
      createdAt:   new Date().toISOString(),
    }]);
  }
};

// ── Session ──────────────────────────────────────────────────────────────────
export const getSession   = ()    => load(SESSION_KEY, null);
export const clearSession = ()    => { try { localStorage.removeItem(SESSION_KEY); } catch {} };

export const setSession = (user) => {
  const { password: _, ...safe } = user;
  save(SESSION_KEY, safe);
  return safe;
};

// ── Auto-seed on module load ─────────────────────────────────────────────────
seedAdmin();

// ── Login ────────────────────────────────────────────────────────────────────
export const login = (username, password) => {
  seedAdmin(); // guarantee admin exists even if localStorage was cleared
  const users = getUsers();
  const user  = users.find(
    u => u.username.toLowerCase() === username.toLowerCase().trim()
      && u.password === password
  );
  if (!user)        return { error: "Usuário ou senha incorretos." };
  if (!user.active) return { error: "Conta desativada. Fale com o administrador." };
  return { session: setSession(user) };
};

// ── Permission check ─────────────────────────────────────────────────────────
// Admins always return true. Mechanics check their permissions object.
export const can = (session, permKey) => {
  if (!session) return false;
  if (session.role === "admin") return true;
  return !!session.permissions?.[permKey];
};

// ── Re-hydrate session (call on app start to pick up permission changes) ──────
export const refreshSession = () => {
  const session = getSession();
  if (!session || session.role === "admin") return session;
  const users = getUsers();
  const user  = users.find(u => u.id === session.id);
  if (!user || !user.active) { clearSession(); return null; }
  return setSession(user);
};
