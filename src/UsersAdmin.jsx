import { useState, useEffect } from "react";
import { getUsers, saveUsers, ALL_PERMISSIONS, DEFAULT_MECHANIC_PERMS, refreshSession } from "./auth.js";

const uid = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
const fDate = d => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "–";

// ── Modal backdrop ────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161B27", border: "1px solid #1E2D40", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        {children}
      </div>
    </div>
  );
}

// ── User Form (create / edit) ─────────────────────────────────────────────────
function UserForm({ user, onSave, onClose }) {
  const isNew = !user;
  const [form, setForm] = useState(() => user
    ? { ...user }
    : { name: "", username: "", password: "", role: "mechanic", active: true, permissions: { ...DEFAULT_MECHANIC_PERMS } }
  );
  const [pwdVisible, setPwdVisible] = useState(false);
  const [errors, setErrors] = useState({});

  const setF  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setPerm = (k, v) => setForm(p => ({ ...p, permissions: { ...p.permissions, [k]: v } }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Nome obrigatório.";
    if (!form.username.trim()) e.username  = "Usuário obrigatório.";
    if (isNew && !form.password.trim()) e.password = "Senha obrigatória.";
    if (form.password && form.password.length < 4) e.password = "Mínimo 4 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const users = getUsers();
    const dupUser = users.find(u => u.username.toLowerCase() === form.username.toLowerCase() && u.id !== form.id);
    if (dupUser) { setErrors(e => ({ ...e, username: "Este nome de usuário já existe." })); return; }
    onSave(form);
  };

  const toggleAll = (val) => {
    const perms = {};
    ALL_PERMISSIONS.forEach(p => { perms[p.key] = val; });
    setForm(prev => ({ ...prev, permissions: perms }));
  };

  const LabelRow = ({ label, hint }) => (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{hint}</div>}
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "28px 28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>{isNew ? "➕ Novo Mecânico" : "✏️ Editar Usuário"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label className="fl">Nome Completo</label>
          <input className="fi" value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Ex: João da Silva" />
          {errors.name && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
        </div>

        {/* Username */}
        <div style={{ marginBottom: 14 }}>
          <label className="fl">Nome de Usuário</label>
          <input className="fi" value={form.username} onChange={e => setF("username", e.target.value.toLowerCase().replace(/\s/g, "."))} placeholder="joao.silva" />
          {errors.username && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.username}</div>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label className="fl">{isNew ? "Senha" : "Nova Senha (deixe em branco para não alterar)"}</label>
          <div style={{ position: "relative" }}>
            <input className="fi" type={pwdVisible ? "text" : "password"} value={form.password || ""} onChange={e => setF("password", e.target.value)} placeholder={isNew ? "mínimo 4 caracteres" : "••••••••"} style={{ paddingRight: 42 }} />
            <button onClick={() => setPwdVisible(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 16 }}>{pwdVisible ? "🙈" : "👁️"}</button>
          </div>
          {errors.password && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.password}</div>}
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <label className="fl">Status</label>
          <select className="fs" value={form.active ? "1" : "0"} onChange={e => setF("active", e.target.value === "1")}>
            <option value="1">✅ Ativo</option>
            <option value="0">🚫 Desativado</option>
          </select>
        </div>

        {/* Permissions — only for mechanics */}
        {form.role !== "admin" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label className="fl" style={{ marginBottom: 0 }}>Permissões</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleAll(true)}  style={{ fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}>Todas ✓</button>
                <button onClick={() => toggleAll(false)} style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}>Nenhuma ✗</button>
              </div>
            </div>
            <div style={{ border: "1px solid #1E2D40", borderRadius: 8, overflow: "hidden" }}>
              {ALL_PERMISSIONS.map((p, i) => (
                <div key={p.key} onClick={() => setPerm(p.key, !form.permissions?.[p.key])} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i > 0 ? "1px solid #1E2D40" : "none", cursor: "pointer", transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1E2D40"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${form.permissions?.[p.key] ? "#F97316" : "#2D3748"}`, background: form.permissions?.[p.key] ? "#F97316" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                    {form.permissions?.[p.key] && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <LabelRow label={p.label} />
                </div>
              ))}
            </div>
          </div>
        )}

        {form.role === "admin" && (
          <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, fontSize: 13, color: "#a5b4fc" }}>
            👑 Conta de Administrador — acesso total ao sistema, não requer configuração de permissões.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid #1E2D40" }}>
          <button onClick={onClose} style={{ background: "#1E2533", color: "#CBD5E1", border: "1px solid #2D3748", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, fontSize: 14 }}>Cancelar</button>
          <button onClick={handleSave} style={{ background: "#F97316", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 15 }}>{isNew ? "Criar Conta" : "Salvar Alterações"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, currentUserId, onEdit, onToggle, onDelete, onResetPwd }) {
  const isMe = user.id === currentUserId;
  const activePerms = user.role === "admin" ? ALL_PERMISSIONS.length : ALL_PERMISSIONS.filter(p => user.permissions?.[p.key]).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 16, alignItems: "center", padding: "14px 20px", borderTop: "1px solid #1E2D40" }}>
      {/* Avatar */}
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: user.role === "admin" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "linear-gradient(135deg,#F97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {user.role === "admin" ? "👑" : "🔧"}
      </div>

      {/* Info */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>{user.name}</span>
          {isMe && <span style={{ fontSize: 10, color: "#6366f1", background: "rgba(99,102,241,0.15)", borderRadius: 999, padding: "1px 8px", border: "1px solid rgba(99,102,241,0.3)", fontWeight: 700 }}>VOCÊ</span>}
          {!user.active && <span style={{ fontSize: 10, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 999, padding: "1px 8px", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 700 }}>DESATIVADO</span>}
        </div>
        <div style={{ fontSize: 12, color: "#64748B" }}>@{user.username} · {user.role === "admin" ? "Administrador" : "Mecânico"}</div>
        {user.role !== "admin" && (
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{activePerms}/{ALL_PERMISSIONS.length} permissões ativas</div>
        )}
        <div style={{ fontSize: 10, color: "#374151", marginTop: 1 }}>Criado em {fDate(user.createdAt)}</div>
      </div>

      {/* Status toggle */}
      {user.role !== "admin" && !isMe && (
        <div onClick={() => onToggle(user)} title={user.active ? "Desativar conta" : "Ativar conta"} style={{ width: 44, height: 24, borderRadius: 12, background: user.active ? "#22c55e" : "#374151", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: user.active ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
        </div>
      )}
      {(user.role === "admin" || isMe) && <div style={{ width: 44 }} />}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onEdit(user)} title="Editar" style={{ background: "#1E2533", border: "1px solid #2D3748", color: "#94A3B8", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13, transition: "all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.color = "#F97316"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2D3748"; e.currentTarget.style.color = "#94A3B8"; }}>✏️</button>
        {!isMe && user.role !== "admin" && (
          <button onClick={() => onDelete(user)} title="Remover" style={{ background: "#7f1d1d20", border: "1px solid #7f1d1d50", color: "#fca5a5", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13, transition: "all .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#7f1d1d40"}
            onMouseLeave={e => e.currentTarget.style.background = "#7f1d1d20"}>🗑️</button>
        )}
      </div>
    </div>
  );
}

// ── Permission Overview Modal ─────────────────────────────────────────────────
function PermOverview({ user, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 20, fontWeight: 700, color: "#F1F5F9" }}>Permissões — {user.name}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {ALL_PERMISSIONS.map(p => (
          <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #1E2D40" }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: user.permissions?.[p.key] ? "#22c55e" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
              {user.permissions?.[p.key] ? "✓" : "✗"}
            </div>
            <span style={{ fontSize: 15 }}>{p.icon}</span>
            <span style={{ fontSize: 13, color: user.permissions?.[p.key] ? "#E2E8F0" : "#4B5563" }}>{p.label}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UsersAdmin({ session }) {
  const [users,    setUsers]    = useState(() => getUsers());
  const [modal,    setModal]    = useState(null); // "new" | "edit" | "perms"
  const [selUser,  setSelUser]  = useState(null);
  const [toast,    setToast]    = useState("");

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const persist = (updated) => {
    saveUsers(updated);
    setUsers(updated);
  };

  const handleSave = (form) => {
    const current = getUsers();
    if (form.id) {
      // Edit existing
      const updated = current.map(u => {
        if (u.id !== form.id) return u;
        const next = { ...u, name: form.name, username: form.username, active: form.active, permissions: form.permissions };
        if (form.password?.trim()) next.password = form.password.trim();
        return next;
      });
      persist(updated);
      showToast("✅ Usuário atualizado com sucesso.");
    } else {
      // Create new
      const newUser = {
        id:          uid(),
        name:        form.name.trim(),
        username:    form.username.trim(),
        password:    form.password.trim(),
        role:        "mechanic",
        active:      true,
        permissions: form.permissions,
        createdAt:   new Date().toISOString(),
      };
      persist([...current, newUser]);
      showToast("✅ Mecânico criado com sucesso.");
    }
    setModal(null);
    setSelUser(null);
  };

  const handleToggle = (user) => {
    const updated = getUsers().map(u => u.id === user.id ? { ...u, active: !u.active } : u);
    persist(updated);
    showToast(`${user.active ? "🚫 Conta desativada" : "✅ Conta ativada"}: ${user.name}`);
  };

  const handleDelete = (user) => {
    if (!window.confirm(`Remover permanentemente a conta de "${user.name}"? Esta ação não pode ser desfeita.`)) return;
    persist(getUsers().filter(u => u.id !== user.id));
    showToast("🗑️ Usuário removido.");
  };

  const openEdit = (user) => { setSelUser(user); setModal("edit"); };
  const openNew  = ()     => { setSelUser(null);  setModal("new"); };

  const admins   = users.filter(u => u.role === "admin");
  const mechs    = users.filter(u => u.role !== "admin");
  const activeCt = mechs.filter(u => u.active).length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#161B27", border: "1px solid #1E2D40", borderRadius: 10, padding: "12px 20px", fontSize: 14, color: "#E2E8F0", zIndex: 2000, boxShadow: "0 8px 30px rgba(0,0,0,.5)", animation: "fadeIn .3s ease" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 30, fontWeight: 800, color: "#F1F5F9" }}>Gerenciar Usuários</h1>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>{mechs.length} mecânico(s) · {activeCt} ativo(s)</p>
        </div>
        <button onClick={openNew} style={{ background: "#F97316", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          ➕ Novo Mecânico
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { l: "Total de Contas",    v: users.length,       c: "#6366f1" },
          { l: "Mecânicos Ativos",   v: activeCt,           c: "#22c55e" },
          { l: "Contas Desativadas", v: mechs.filter(u => !u.active).length, c: "#6b7280" },
        ].map(s => (
          <div key={s.l} style={{ background: "#161B27", border: "1px solid #1E2D40", borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${s.c}` }}>
            <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{s.l}</div>
            <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 30, fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Admin accounts */}
      <div style={{ background: "#161B27", border: "1px solid #1E2D40", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "rgba(99,102,241,0.08)", borderBottom: "1px solid #1E2D40", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>👑</span>
          <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 17, fontWeight: 700, color: "#a5b4fc" }}>Administradores</span>
          <span style={{ fontSize: 11, color: "#6366f1", marginLeft: "auto" }}>Acesso total ao sistema</span>
        </div>
        {admins.map(u => (
          <UserRow key={u.id} user={u} currentUserId={session.id} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} onResetPwd={() => {}} />
        ))}
      </div>

      {/* Mechanic accounts */}
      <div style={{ background: "#161B27", border: "1px solid #1E2D40", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "rgba(249,115,22,0.06)", borderBottom: "1px solid #1E2D40", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔧</span>
          <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 17, fontWeight: 700, color: "#fdba74" }}>Mecânicos / Técnicos</span>
          <span style={{ fontSize: 11, color: "#F97316", marginLeft: "auto" }}>Permissões configuráveis</span>
        </div>
        {mechs.length === 0
          ? <div style={{ padding: "32px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
              Nenhum mecânico cadastrado ainda.<br />
              <button onClick={openNew} style={{ marginTop: 14, background: "none", border: "1px solid #F97316", color: "#F97316", borderRadius: 6, padding: "7px 18px", cursor: "pointer", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 13 }}>+ Adicionar Mecânico</button>
            </div>
          : mechs.map(u => (
              <UserRow key={u.id} user={u} currentUserId={session.id} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} onResetPwd={() => {}} />
            ))
        }
      </div>

      {/* Permissions Legend */}
      <div style={{ background: "#161B27", border: "1px solid #1E2D40", borderRadius: 10, padding: 20, marginTop: 20 }}>
        <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 17, fontWeight: 700, color: "#F1F5F9", marginBottom: 14 }}>📋 Guia de Permissões</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {ALL_PERMISSIONS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8", padding: "6px 0" }}>
              <span>{p.icon}</span> {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {(modal === "new" || modal === "edit") && (
        <UserForm user={selUser} onSave={handleSave} onClose={() => { setModal(null); setSelUser(null); }} />
      )}

      <style>{`
        .fl{display:block;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;}
        .fi{width:100%;background:#0D1117;border:1px solid #2D3748;color:#E2E8F0;padding:10px 14px;border-radius:6px;font-size:14px;font-family:'Barlow',sans-serif;transition:border-color .15s;outline:none;}
        .fi:focus{border-color:#F97316;}
        .fs{width:100%;background:#0D1117;border:1px solid #2D3748;color:#E2E8F0;padding:10px 14px;border-radius:6px;font-size:14px;font-family:'Barlow',sans-serif;outline:none;}
        .fs:focus{border-color:#F97316;}
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
