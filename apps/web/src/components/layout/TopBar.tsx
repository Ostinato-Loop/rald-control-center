import { LogOut, Bell, User } from "lucide-react";
import { RaldLogo } from "@/components/shared/RaldLogo";
import { useAuth } from "@/hooks/useAuth";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] flex-shrink-0" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-2">
        <RaldLogo height={22} theme="dark" accentColor="#00E5FF" />
        <span className="text-[var(--muted)] text-xs font-mono">/</span>
        <span className="text-xs font-mono text-[var(--muted)]">CONTROL CENTER</span>
        <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-[rgba(0,229,255,0.1)] text-[var(--cyan)] border border-[rgba(0,229,255,0.2)] font-mono">v1.0</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border)]">
          <User className="w-3.5 h-3.5 text-[var(--cyan)]" />
          <span className="text-xs font-mono text-[var(--text)]">{user?.username}</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[rgba(168,85,247,0.15)] text-[var(--purple)]">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--red)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
