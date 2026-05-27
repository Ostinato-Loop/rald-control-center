import { useLocation } from "wouter";
import { LayoutDashboard, Github, Brain, BookOpen, Workflow, Server, Languages, ScrollText, Terminal, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "GitHub", href: "/github", icon: Github },
  { label: "AI Providers", href: "/ai-providers", icon: Brain },
  { label: "AI Registry", href: "/ai-registry", icon: BookOpen },
  { label: "n8n Workflows", href: "/n8n", icon: Workflow },
  { label: "Infrastructure", href: "/infrastructure", icon: Server },
  { label: "Languages", href: "/languages", icon: Languages },
  { label: "Audit Logs", href: "/audit", icon: ScrollText },
];

export function Sidebar() {
  const [location, navigate] = useLocation();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--border)]" style={{ background: "var(--surface)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.25)" }}>
          <Terminal className="w-4 h-4 text-[var(--cyan)]" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wider text-[var(--cyan)] font-mono">RALD OS</div>
          <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest">Control Center</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = location === href || (href === "/dashboard" && location === "/");
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all group relative",
                active
                  ? "text-[var(--cyan)] bg-[rgba(0,229,255,0.07)]"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--cyan)] rounded-r" />}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="text-[10px] text-[var(--muted)] font-mono">
          <div className="text-[var(--green)] mb-0.5">● SYSTEM ONLINE</div>
          <div>control.rald.cloud</div>
        </div>
      </div>
    </aside>
  );
}
