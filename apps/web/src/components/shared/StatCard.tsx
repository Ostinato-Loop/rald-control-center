import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: "cyan" | "amber" | "purple" | "green" | "red";
  trend?: string;
}

const accents = {
  cyan: { icon: "rgba(0,229,255,0.12)", text: "var(--cyan)", border: "rgba(0,229,255,0.2)" },
  amber: { icon: "rgba(245,158,11,0.12)", text: "var(--amber)", border: "rgba(245,158,11,0.2)" },
  purple: { icon: "rgba(168,85,247,0.12)", text: "var(--purple)", border: "rgba(168,85,247,0.2)" },
  green: { icon: "rgba(34,197,94,0.12)", text: "var(--green)", border: "rgba(34,197,94,0.2)" },
  red: { icon: "rgba(239,68,68,0.12)", text: "var(--red)", border: "rgba(239,68,68,0.2)" },
};

export function StatCard({ label, value, sub, icon: Icon, accent = "cyan", trend }: Props) {
  const a = accents[accent];
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: a.icon, border: `1px solid ${a.border}` }}
        >
          <Icon className="w-5 h-5" style={{ color: a.text }} />
        </div>
        {trend && (
          <span className="text-xs font-mono" style={{ color: a.text }}>{trend}</span>
        )}
      </div>
      <div>
        <div className="stat-value" style={{ color: a.text }}>{value}</div>
        <div className="stat-label mt-1">{label}</div>
        {sub && <div className="text-xs text-[var(--muted)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
