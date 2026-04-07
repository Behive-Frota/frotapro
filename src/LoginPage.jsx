import { useState } from "react";
import { login } from "./auth.js";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      setError("Preencha usuário e senha.");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const result = login(username.trim(), password);
      setLoading(false);
      if (result.error) { setError(result.error); return; }
      onLogin(result.session);
    }, 600);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0D1117",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      fontFamily: "'Barlow', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .login-input {
          width: 100%;
          background: #0D1117;
          border: 1px solid #2D3748;
          color: #E2E8F0;
          padding: 13px 16px;
          border-radius: 8px;
          font-size: 15px;
          font-family: 'Barlow', sans-serif;
          transition: border-color .2s, box-shadow .2s;
          outline: none;
        }
        .login-input:focus {
          border-color: #F97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
        }
        .login-input::placeholder { color: #4B5563; }
        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #F97316, #ea580c);
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 17px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all .2s;
          box-shadow: 0 4px 20px rgba(249,115,22,0.3);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(249,115,22,0.4);
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72,
            background: "linear-gradient(135deg, #F97316, #ea6c10)",
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 20px",
            boxShadow: "0 0 40px rgba(249,115,22,0.35)",
          }}>🚛</div>
          <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 32, color: "#F1F5F9", letterSpacing: 3 }}>FROTA PRO</div>
          <div style={{ fontSize: 12, color: "#475569", letterSpacing: 2, marginTop: 4 }}>GESTÃO DE MANUTENÇÃO DE FROTA</div>
        </div>

        {/* Card */}
        <div style={{
          background: "#161B27",
          border: "1px solid #1E2D40",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}>
          <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 22, fontWeight: 700, color: "#F1F5F9", marginBottom: 28 }}>Entrar na sua conta</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>Usuário</label>
            <input
              className="login-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              placeholder="seu.usuario"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                className="login-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button
                onClick={() => setShowPwd(p => !p)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 18, padding: 4 }}
              >{showPwd ? "🙈" : "👁️"}</button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#fca5a5", display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Verificando…" : "Entrar →"}
          </button>
        </div>

        {/* Hint */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          Acesso restrito a usuários autorizados.<br />
          Entre em contato com o administrador para obter acesso.
        </div>
      </div>
    </div>
  );
}
