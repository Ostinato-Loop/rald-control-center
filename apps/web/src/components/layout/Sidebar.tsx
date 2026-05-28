import { useLocation } from "wouter";
import { RaldLogo } from "@/components/shared/RaldLogo";
import { LayoutDashboard, Github, Brain, BookOpen, Workflow, Server, Languages, ScrollText, ChevronRight, KeyRound } from "lucide-react";
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
  { label: "Obs. Keys", href: "/observability", icon: KeyRound },
];

export function Sidebar() {
  const [location, navigate] = useLocation();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--border)]" style={{ background: "var(--surface)" }}>
      {/* Logo */}
      <div className="flex flex-col px-5 py-5 border-b border-[var(--border)] gap-1">
        <RaldLogo height={28} theme="dark" accentColor="var(--cyan)" className="mb-0.5" />
        <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-mono">Control Center</div>
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
