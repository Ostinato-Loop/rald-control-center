import { useState } from "react";
import { Terminal, Lock, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: { username: string } }>("/auth/login", { username, password });
      login(res.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,229,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none opacity-10"
        style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.4) 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", boxShadow: "0 0 40px rgba(0,229,255,0.15)" }}>
            <Terminal className="w-8 h-8 text-[var(--cyan)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-mono text-[var(--cyan)]">RALD OS</h1>
          <p className="text-xs text-[var(--muted)] mt-1 uppercase tracking-widest">Control Center · RALD.cloud</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-1 text-[var(--text)]">Authentication Required</h2>
          <p className="text-xs text-[var(--muted)] mb-6">Enter your credentials to access the control plane.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
                <input
                  className="input pl-9 font-mono"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
                <input
                  type="password"
                  className="input pl-9 font-mono"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-[var(--red)] font-mono p-2 rounded bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
                ACCESS DENIED: {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full font-mono uppercase tracking-widest justify-center">
              {loading ? "Authenticating..." : "Initialize Session"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[var(--muted)] mt-4 font-mono">
          RALD.cloud · Enterprise AI Infrastructure
        </p>
      </div>
    </div>
  );
}
