import { createFileRoute } from "@tanstack/react-router";
import { PagsibolShell } from "@/components/PagsibolShell";
import { STATIONS, formatTime } from "@/lib/orgs";
import { useScores } from "@/lib/scores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PAGSIBOL 2026 — Live Leaderboard" },
      { name: "description", content: "Real-time leaderboard for the PAGSIBOL Leadership Challenge at LSPU Los Baños. Lowest total time wins." },
      { property: "og:title", content: "PAGSIBOL 2026 — Live Leaderboard" },
      { property: "og:description", content: "Real-time leaderboard for the PAGSIBOL Leadership Challenge at LSPU Los Baños." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leaderboard,
});

const LABELS: Record<number, string> = { 1: "Champion", 2: "2nd Place", 3: "3rd Place", 4: "4th Place" };

function Leaderboard() {
  const { ranked, top4, loading } = useScores();
  const finals = [1, 2, 3, 4].map((r) => top4.find((e) => e.final_rank === r)).filter(Boolean);

  return (
    <PagsibolShell subtitle="Live leaderboard · lowest total time wins · Top 4 battle for ranks 1–4">
      {finals.length > 0 && (
        <section className="glass mb-8 rounded-2xl p-5">
          <h2 className="font-display mb-4 text-center text-2xl uppercase tracking-wider text-gold">Final Results</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((rank) => {
              const w = top4.find((e) => e.final_rank === rank);
              if (!w) return null;
              return (
                <div key={rank} className={cn("flex items-center gap-4 rounded-xl px-4 py-3", rank === 1 ? "bg-gold text-gold-foreground" : "bg-foreground/10")}>
                  <span className="font-display text-4xl">{rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{w.name}</p>
                    <p className="text-xs uppercase tracking-wider opacity-80">{LABELS[rank]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="glass rounded-2xl p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between px-2">
          <h2 className="font-display text-xl uppercase tracking-wider">Standings</h2>
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/80">
            <span className="live-dot" /> Live
          </span>
        </div>
        {loading ? (
          <p className="p-6 text-center text-foreground/70">Loading…</p>
        ) : (
          <div className="space-y-2">
            {ranked.map((e, i) => {
              const top = e.total !== null && i < 4;
              return (
                <div key={e.name} className={cn("leaderboard-row flex items-center gap-4 rounded-xl px-4 py-3", top ? "top4-glow bg-gold/20 ring-1 ring-gold" : "bg-foreground/5")}>
                  <span className={cn("font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg", top ? "bg-gold text-gold-foreground" : "bg-foreground/10")}>
                    {e.total !== null ? i + 1 : "–"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.name}</p>
                    <p className="text-xs text-foreground/70">
                      {STATIONS.map((s) => `${s.label} ${formatTime(e[s.key])}`).join(" · ")}
                    </p>
                  </div>
                  <span className="font-display shrink-0 text-2xl tabular-nums">{formatTime(e.total)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PagsibolShell>
  );
}
