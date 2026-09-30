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

function LeaderboardTable({
  items,
  startIndex,
  totalRows = 13,
}: {
  items: RankedScoreRow[];
  startIndex: number;
  totalRows?: number;
}) {
  // Pad items so that both left and right tables have exactly totalRows (13) rows and align identically
  const paddedItems: (RankedScoreRow | null)[] = [
    ...items,
    ...Array(Math.max(0, totalRows - items.length)).fill(null),
  ];

  return (
    <div className="glass flex flex-1 flex-col h-full min-h-0 overflow-hidden rounded-xl border border-foreground/15 shadow-2xl">
      {/* Table Header Row (fixed height ~28px) */}
      <div className="shrink-0 flex items-center border-b border-foreground/15 bg-background/85 px-2 py-1 text-[10px] sm:text-[11px] font-display uppercase tracking-wider text-foreground/80">
        <span className="w-6 sm:w-7 text-center shrink-0">#</span>
        <span className="flex-1 min-w-0 px-1.5 sm:px-2">Organization</span>
        {STATIONS.map((s) => (
          <span key={s.key} className="w-11 sm:w-13 text-center shrink-0" title={s.full}>
            <span className="hidden xl:inline">{s.label}</span>
            <span className="xl:hidden">{s.label.slice(0, 3)}</span>
          </span>
        ))}
        <span className="w-13 sm:w-16 text-right shrink-0 text-gold font-bold">Total</span>
      </div>

      {/* Rows Container: fills remaining height, evenly divides between rows with ZERO overflow */}
      <div className="flex-1 min-h-0 flex flex-col justify-between divide-y divide-foreground/10">
        {paddedItems.map((e, idx) => {
          if (!e) {
            // Invisible placeholder row to keep heights aligned
            return (
              <div
                key={`empty-${idx}`}
                className="flex-1 min-h-0 flex items-center px-2 opacity-0 pointer-events-none"
              >
                <span className="w-6 sm:w-7">&nbsp;</span>
              </div>
            );
          }

          const overallRank = startIndex + idx + 1;
          const hasScore = e.completedCount > 0;
          const isComplete = e.completedCount === 4;
          const isTop4 = isComplete && overallRank <= 4;

          return (
            <div
              key={e.name}
              className={cn(
                "flex-1 min-h-0 flex items-center px-2 transition-colors",
                isTop4
                  ? "bg-gold/20 hover:bg-gold/25 font-semibold"
                  : (startIndex + idx) % 2 === 0
                    ? "bg-foreground/[0.02] hover:bg-foreground/10"
                    : "bg-foreground/[0.05] hover:bg-foreground/10",
              )}
            >
              {/* Rank Badge */}
              <div className="w-6 sm:w-7 shrink-0 text-center">
                <span
                  className={cn(
                    "inline-flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full font-display text-[9px] sm:text-[11px]",
                    isTop4
                      ? "bg-gold text-gold-foreground font-bold shadow-sm"
                      : hasScore
                        ? "bg-foreground/15 text-foreground"
                        : "text-foreground/30",
                  )}
                >
                  {hasScore ? overallRank : "–"}
                </span>
              </div>

              {/* Org Name */}
              <div
                className="flex-1 min-w-0 px-1.5 sm:px-2 font-medium truncate text-[10px] sm:text-[11px] xl:text-xs"
                title={e.name}
              >
                <span className={cn(isTop4 && "text-gold font-bold")}>{e.name}</span>
              </div>

              {/* Station Scores: Unity, Integrity, Stewardship, Collaboration */}
              {STATIONS.map((s) => (
                <div
                  key={s.key}
                  className={cn(
                    "w-11 sm:w-13 shrink-0 text-center font-mono tabular-nums text-[10px] sm:text-[11px]",
                    e[s.key] !== null ? "font-medium text-foreground" : "text-foreground/30",
                  )}
                >
                  {formatTime(e[s.key])}
                </div>
              ))}

              {/* Total Time */}
              <div className="w-13 sm:w-16 shrink-0 text-right font-mono tabular-nums text-[10px] sm:text-[11px] xl:text-xs">
                {isComplete ? (
                  <span className="font-bold text-gold">{formatTime(e.total)}</span>
                ) : e.insertedTotal !== null ? (
                  <span className="font-medium text-foreground/90">
                    {formatTime(e.insertedTotal)}
                    <span className="ml-0.5 text-[8px] sm:text-[9px] text-foreground/50 font-sans">
                      ({e.completedCount}/4)
                    </span>
                  </span>
                ) : (
                  <span className="text-foreground/30 font-normal">—</span>
                )}
              </div>
            </div>
          );
        })}
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

  // Split into 2 balanced columns: 13 on left, 12 on right (ALWAYS side-by-side)
  const midPoint = Math.ceil(ranked.length / 2);
  const leftCol = ranked.slice(0, midPoint);
  const rightCol = ranked.slice(midPoint);

  const headerExtra =
    finals.length > 0 ? (
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-x-auto py-0.5">
        <span className="font-display text-[10px] sm:text-xs text-gold uppercase tracking-wider shrink-0">
          Championship:
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
                "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold shrink-0 ring-1",
                cfg.badgeCls,
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="font-display">#{rank}</span>
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{winner.name}</span>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="hidden md:flex items-center justify-center gap-2 text-[11px] text-foreground/75 truncate">
        <span className="font-semibold text-gold">Lacson Gymnasium</span>
        <span>·</span>
        <span>Lowest Total Time Wins</span>
        <span>·</span>
        <span>Top 4 Advance to Finals</span>
      </div>
    );

  return (
    <PagsibolShell compact headerExtra={headerExtra}>
      {loading ? (
        <div className="glass flex flex-1 items-center justify-center rounded-xl p-8 text-foreground/70">
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <p className="font-display text-sm tracking-wider uppercase">Loading Scores…</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full min-h-0 flex-1 grid grid-cols-2 gap-2 sm:gap-3 overflow-hidden select-none">
          <LeaderboardTable items={leftCol} startIndex={0} totalRows={midPoint} />
          <LeaderboardTable items={rightCol} startIndex={midPoint} totalRows={midPoint} />
        </div>
      )}
    </PagsibolShell>
  );
}
