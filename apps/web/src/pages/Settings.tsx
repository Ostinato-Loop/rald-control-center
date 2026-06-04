import { useState } from "react";
import { Lock, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (next !== confirm) { setStatus("err"); setMsg("New passwords do not match."); return; }
    if (next.length < 8) { setStatus("err"); setMsg("Password must be at least 8 characters."); return; }
    setStatus("loading");
    try {
      await api.patch("/auth/change-password", { currentPassword: current, newPassword: next });
      setStatus("ok");
      setMsg("Password changed. You will be logged out in 3 seconds.");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => logout(), 3000);
    } catch (e: unknown) {
      setStatus("err");
      setMsg(e instanceof Error ? e.message : "Failed to change password.");
    }
  };

  const field = (label: string, val: string, set: (v:string)=>void, id: string) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-mono text-[var(--muted)] uppercase tracking-widest">
        {label}
      </label>
      <input
        id={id} type="password" value={val} onChange={e => set(e.target.value)}
        required autoComplete="off"
        className="w-full px-3 py-2.5 rounded text-sm font-mono text-[var(--text)] border border-[var(--border)] outline-none focus:border-[var(--cyan)] transition-colors"
        style={{ background: "var(--bg)" }}
      />
    </div>
  );

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-xl font-mono font-bold text-[var(--text)] mb-1">Settings</h1>
        <p className="text-sm text-[var(--muted)]">Account security and preferences.</p>
      </div>

      {/* Account info */}
      <div className="rounded-lg border border-[var(--border)] p-5 space-y-3" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-2 text-sm font-mono text-[var(--cyan)] mb-3">
          <Shield className="w-4 h-4" /> Account
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-0.5">Username</div>
            <div className="font-mono text-[var(--text)]">{user?.username}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-0.5">Email</div>
            <div className="font-mono text-[var(--text)]">{user?.email}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-0.5">Role</div>
            <div className="font-mono text-[var(--cyan)] uppercase">{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-lg border border-[var(--border)] p-5" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-2 text-sm font-mono text-[var(--cyan)] mb-5">
          <Lock className="w-4 h-4" /> Change Password
        </div>
        <form onSubmit={submit} className="space-y-4">
          {field("Current Password", current, setCurrent, "cur")}
          {field("New Password", next, setNext, "nxt")}
          {field("Confirm New Password", confirm, setConfirm, "cnf")}

          {status === "ok" && (
            <div className="flex items-center gap-2 text-sm text-[var(--green)] bg-[rgba(0,255,136,0.06)] border border-[rgba(0,255,136,0.2)] rounded px-3 py-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {msg}
            </div>
          )}
          {status === "err" && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-[rgba(255,80,80,0.06)] border border-[rgba(255,80,80,0.2)] rounded px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {msg}
            </div>
          )}

          <button
            type="submit" disabled={status === "loading"}
            className="w-full py-2.5 rounded text-sm font-mono font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--cyan)", color: "var(--bg)" }}
          >
            {status === "loading" ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
