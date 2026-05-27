import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LanguagePack } from "@/lib/api";
import { Languages as LangIcon, ToggleLeft, ToggleRight } from "lucide-react";

export default function Languages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<LanguagePack[]>({
    queryKey: ["languages"],
    queryFn: () => api.get("/languages"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/languages/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["languages"] }),
  });

  const flags: Record<string, string> = {
    yo: "🇳🇬", ig: "🇳🇬", ha: "🇳🇬", sw: "🇹🇿", pcm: "🇳🇬", tw: "🇬🇭", am: "🇪🇹", zu: "🇿🇦",
  };

  if (isLoading) return <div className="text-[var(--muted)] font-mono animate-pulse">Loading language packs...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold flex items-center gap-2"><LangIcon className="w-5 h-5 text-[var(--cyan)]" /> African Language Intelligence</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(data ?? []).map(l => (
          <div key={l.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{flags[l.language_code] ?? "🌍"}</span>
                <div>
                  <div className="font-semibold">{l.language_name}</div>
                  <div className="font-mono text-xs text-[var(--muted)]">{l.language_code.toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => toggle.mutate({ id: l.id, is_active: !l.is_active })}>
                {l.is_active ? <ToggleRight className="w-6 h-6 text-[var(--green)]" /> : <ToggleLeft className="w-6 h-6 text-[var(--muted)]" />}
              </button>
            </div>

            {/* Accuracy bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--muted)]">Accuracy</span>
                <span className="font-mono text-[var(--cyan)]">{l.accuracy}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${l.accuracy}%`, background: l.accuracy >= 90 ? "var(--green)" : l.accuracy >= 80 ? "var(--cyan)" : "var(--amber)" }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[["Dialects", l.dialect_count], ["Slang", l.slang_entries], ["Voices", l.voice_accent_count]].map(([k, v]) => (
                <div key={String(k)} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="font-mono text-sm text-[var(--cyan)]">{v}</div>
                  <div className="text-[10px] text-[var(--muted)]">{k}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
