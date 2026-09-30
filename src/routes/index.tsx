import { createFileRoute } from "@tanstack/react-router";
import { PagsibolShell } from "@/components/PagsibolShell";
import { STATIONS, formatTime } from "@/lib/orgs";
import { useScores, type RankedScoreRow } from "@/lib/scores";
import { cn } from "@/lib/utils";
import { Trophy, Award, Medal } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PAGSIBOL 2026 — Live Leaderboard" },
      {
        name: "description",
        content:
          "Real-time leaderboard for the PAGSIBOL Leadership Challenge at LSPU Los Baños. Lowest total time wins.",
      },
      { property: "og:title", content: "PAGSIBOL 2026 — Live Leaderboard" },
      {
        property: "og:description",
        content: "Real-time leaderboard for the PAGSIBOL Leadership Challenge at LSPU Los Baños.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leaderboard,
});

const FINAL_CONFIG: Record<number, { label: string; icon: typeof Trophy; badgeCls: string }> = {
  1: { label: "Champion", icon: Trophy, badgeCls: "bg-gold text-gold-foreground ring-gold" },
  2: { label: "2nd Place", icon: Award, badgeCls: "bg-slate-200 text-slate-900 ring-slate-300" },
  3: { label: "3rd Place", icon: Medal, badgeCls: "bg-amber-600 text-white ring-amber-500" },
  4: {
    label: "4th Place",
    icon: Medal,
    badgeCls: "bg-foreground/20 text-foreground ring-foreground/40",
  },
};

function LeaderboardTable({ items, startIndex }: { items: RankedScoreRow[]; startIndex: number }) {
  return (
    <div className="glass flex flex-1 flex-col overflow-hidden rounded-xl border border-foreground/15 shadow-xl">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full h-full border-collapse text-left text-[11px] xl:text-xs">
          <thead className="sticky top-0 z-10 border-b border-foreground/15 bg-background/80 backdrop-blur-md text-[10px] xl:text-[11px] uppercase tracking-wider text-foreground/80">
            <tr>
              <th className="w-8 py-1.5 px-2 text-center font-display">#</th>
              <th className="py-1.5 px-2.5 font-display">Organization</th>
              {STATIONS.map((s) => (
                <th
                  key={s.key}
                  className="w-14 xl:w-16 py-1.5 px-1 text-center font-display"
                  title={s.full}
                >
                  <span className="hidden xl:inline">{s.label}</span>
                  <span className="xl:hidden">{s.label.slice(0, 3)}</span>
                </th>
              ))}
              <th className="w-16 xl:w-20 py-1.5 px-2.5 text-right font-display text-gold">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {items.map((e, idx) => {
              const overallRank = startIndex + idx + 1;
              const hasScore = e.completedCount > 0;
              const isComplete = e.completedCount === 4;
              const isTop4 = isComplete && overallRank <= 4;

              return (
                <tr
                  key={e.name}
                  className={cn(
                    "transition-colors leading-none",
                    isTop4
                      ? "bg-gold/20 hover:bg-gold/30 font-semibold"
                      : (startIndex + idx) % 2 === 0
                        ? "bg-foreground/[0.02] hover:bg-foreground/10"
                        : "bg-foreground/[0.05] hover:bg-foreground/10",
                  )}
                >
                  {/* Rank Cell */}
                  <td className="py-1 px-1.5 text-center">
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full font-display text-[10px] xl:text-xs",
                        isTop4
                          ? "bg-gold text-gold-foreground font-bold shadow-sm"
                          : hasScore
                            ? "bg-foreground/15 text-foreground"
                            : "text-foreground/35",
                      )}
                    >
                      {hasScore ? overallRank : "–"}
                    </span>
                  </td>

                  {/* Organization Name */}
                  <td
                    className="py-1 px-2.5 font-medium truncate max-w-[140px] sm:max-w-[180px] xl:max-w-[260px]"
                    title={e.name}
                  >
                    <span className={cn(isTop4 && "text-gold font-bold")}>{e.name}</span>
                  </td>

                  {/* Station Scores: Unity, Integrity, Stewardship, Collaboration */}
                  {STATIONS.map((s) => (
                    <td
                      key={s.key}
                      className={cn(
                        "py-1 px-1 text-center font-mono tabular-nums text-[10px] xl:text-xs",
                        e[s.key] !== null ? "font-medium text-foreground" : "text-foreground/30",
                      )}
                    >
                      {formatTime(e[s.key])}
                    </td>
                  ))}

                  {/* Total Time Cell */}
                  <td className="py-1 px-2.5 text-right font-mono tabular-nums text-[11px] xl:text-xs">
                    {isComplete ? (
                      <span className="font-bold text-gold">{formatTime(e.total)}</span>
                    ) : e.insertedTotal !== null ? (
                      <span className="font-medium text-foreground/90">
                        {formatTime(e.insertedTotal)}
                        <span className="ml-0.5 text-[9px] text-foreground/50 font-sans">
                          ({e.completedCount}/4)
                        </span>
                      </span>
                    ) : (
                      <span className="text-foreground/30 font-normal">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Leaderboard() {
  const { ranked, top4, loading } = useScores();

  const finals = [1, 2, 3, 4]
    .map((rank) => {
      const winner = top4.find((e) => e.final_rank === rank);
      return winner ? { rank, winner } : null;
    })
    .filter((f): f is { rank: number; winner: RankedScoreRow } => Boolean(f));

  // Split into 2 balanced columns: 13 on left, 12 on right
  const midPoint = Math.ceil(ranked.length / 2);
  const leftCol = ranked.slice(0, midPoint);
  const rightCol = ranked.slice(midPoint);

  return (
    <PagsibolShell
      compact
      subtitle="Live Leaderboard · Lowest total time wins · Top 4 advance to finals"
    >
      {/* Top Finalists Bar (if championship ranks are assigned) */}
      {finals.length > 0 && (
        <section className="glass mb-2 shrink-0 rounded-xl border border-gold/40 px-3 py-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
            <span className="font-display uppercase tracking-widest text-gold text-[11px] sm:text-xs">
              Championship Standings:
            </span>
            {finals.map(({ rank, winner }) => {
              const cfg = FINAL_CONFIG[rank] ?? {
                label: `Rank ${rank}`,
                icon: Medal,
                badgeCls: "bg-foreground/20 text-foreground ring-foreground/40",
              };
              const Icon = cfg.icon;
              return (
                <div
                  key={rank}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold shadow-sm ring-1",
                    cfg.badgeCls,
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-display">#{rank}</span>
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{winner.name}</span>
                  <span className="text-[10px] opacity-80 uppercase tracking-wider">
                    ({cfg.label})
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Leaderboard Split Table View */}
      {loading ? (
        <div className="glass flex flex-1 items-center justify-center rounded-xl p-8 text-foreground/70">
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <p className="font-display text-sm tracking-wider uppercase">Loading Scores…</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col lg:grid lg:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto lg:overflow-hidden">
          <LeaderboardTable items={leftCol} startIndex={0} />
          <LeaderboardTable items={rightCol} startIndex={midPoint} />
        </div>
      )}
    </PagsibolShell>
  );
}
