import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, RotateCcw, Timer, Crown } from "lucide-react";
import {
  ORGANIZATIONS,
  STATIONS,
  emptyTimes,
  formatTime,
  parseTimeInput,
  totalTime,
  type OrgEntry,
  type StationKey,
} from "@/lib/orgs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PAGSIBOL 2026 — Leadership Challenge Tally & Leaderboard" },
      {
        name: "description",
        content:
          "Live tally sheet and leaderboard for the PAGSIBOL Leadership Challenge Expedition at LSPU Los Baños. Lowest total time wins; Top 4 battle for final ranks.",
      },
      { property: "og:title", content: "PAGSIBOL 2026 — Leadership Challenge Tally & Leaderboard" },
      {
        property: "og:description",
        content:
          "Live tally sheet and leaderboard for the PAGSIBOL Leadership Challenge Expedition at LSPU Los Baños.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "pagsibol-tally-v1";

function loadState(): OrgEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OrgEntry[];
      if (Array.isArray(parsed) && parsed.length === ORGANIZATIONS.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return ORGANIZATIONS.map((name) => ({ name, times: emptyTimes(), finalRank: null }));
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-gold text-gold-foreground",
  2: "bg-secondary text-secondary-foreground",
  3: "bg-accent/60 text-accent-foreground",
  4: "bg-muted text-muted-foreground",
};

const RANK_LABELS: Record<number, string> = { 1: "Champion", 2: "2nd Place", 3: "3rd Place", 4: "4th Place" };

function Index() {
  const [entries, setEntries] = useState<OrgEntry[]>(loadState);
  const [tab, setTab] = useState<"tally" | "leaderboard" | "finals">("tally");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const ranked = useMemo(() => {
    const withTotal = entries.map((e) => ({ ...e, total: totalTime(e.times) }));
    const complete = withTotal.filter((e) => e.total !== null).sort((a, b) => (a.total as number) - (b.total as number));
    const incomplete = withTotal.filter((e) => e.total === null);
    return [...complete, ...incomplete];
  }, [entries]);

  const top4 = useMemo(() => ranked.filter((e) => e.total !== null).slice(0, 4), [ranked]);

  const setTime = (name: string, station: StationKey, raw: string) => {
    const sec = parseTimeInput(raw);
    setEntries((prev) =>
      prev.map((e) => (e.name === name ? { ...e, times: { ...e.times, [station]: sec } } : e)),
    );
  };

  const setFinalRank = (name: string, rank: number | null) => {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        finalRank: e.name === name ? rank : e.finalRank === rank && rank !== null ? null : e.finalRank,
      })),
    );
  };

  const resetAll = () => {
    if (window.confirm("Clear all recorded times and ranks? This cannot be undone.")) {
      setEntries(ORGANIZATIONS.map((name) => ({ name, times: emptyTimes(), finalRank: null })));
    }
  };

  const recordedCount = entries.filter((e) => totalTime(e.times) !== null).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-foreground/70">
            LSPU Los Baños · Supreme Student Council · September 30, 2026
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            PAGSIBOL <span className="text-gold">Leadership Challenge</span>
          </h1>
          <p className="mt-1 text-sm text-navy-foreground/80">
            Tally sheet &amp; live leaderboard — lowest total time wins. Top 4 advance to the final battle for ranks 1–4.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(
              [
                ["tally", "Tally Sheet", Timer],
                ["leaderboard", "Leaderboard", Trophy],
                ["finals", "Top 4 Battle", Crown],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  tab === key
                    ? "bg-gold text-gold-foreground"
                    : "bg-navy-foreground/10 text-navy-foreground hover:bg-navy-foreground/20",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <button
              onClick={resetAll}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-navy-foreground/10 px-4 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === "tally" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Station Times</h2>
              <p className="text-sm text-muted-foreground">
                {recordedCount} of {entries.length} orgs complete · enter times as m:ss (e.g. 2:45)
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary text-left">
                    <th className="px-4 py-3 font-semibold text-secondary-foreground">Organization</th>
                    {STATIONS.map((s) => (
                      <th key={s.key} className="px-3 py-3 font-semibold text-secondary-foreground" title={s.full}>
                        {s.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-semibold text-secondary-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const total = totalTime(entry.times);
                    const isTop4 = top4.some((t) => t.name === entry.name);
                    return (
                      <tr key={entry.name} className={cn("border-b border-border last:border-0", isTop4 && "bg-gold/10")}>
                        <td className="px-4 py-2 font-medium">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                            {isTop4 ? "★" : ""}
                          </span>
                          {entry.name}
                        </td>
                        {STATIONS.map((s) => (
                          <td key={s.key} className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="m:ss"
                              defaultValue={formatTime(entry.times[s.key]) === "—" ? "" : formatTime(entry.times[s.key])}
                              onBlur={(e) => setTime(entry.name, s.key, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center tabular-nums focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right font-display text-base font-bold tabular-nums">
                          {formatTime(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "leaderboard" && (
          <section>
            <h2 className="font-display mb-4 text-xl font-bold">Live Leaderboard</h2>
            <div className="space-y-2">
              {ranked.map((entry, i) => {
                const isTop4 = entry.total !== null && i < 4;
                return (
                  <div
                    key={entry.name}
                    className={cn(
                      "leaderboard-row flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm",
                      isTop4 && "top4-glow border-gold bg-gold/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold",
                        isTop4 ? RANK_STYLES[i + 1] : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {entry.total !== null ? i + 1 : "–"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {STATIONS.map((s) => `${s.label} ${formatTime(entry.times[s.key])}`).join(" · ")}
                      </p>
                    </div>
                    {isTop4 && <Medal className="h-5 w-5 shrink-0 text-gold" />}
                    <span className="font-display shrink-0 text-lg font-bold tabular-nums">
                      {formatTime(entry.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "finals" && (
          <section>
            <h2 className="font-display mb-1 text-xl font-bold">Top 4 Battle — Final Ranks</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The four fastest orgs battle it out. Assign each a final rank (1–4) after the battle.
            </p>
            {top4.length < 4 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                Complete times for at least 4 organizations to reveal the finalists.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {top4.map((entry, i) => (
                  <div key={entry.name} className="rounded-xl border border-gold bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Qualifier #{i + 1} · {formatTime(entry.total)}
                        </p>
                        <p className="mt-1 font-semibold leading-snug">{entry.name}</p>
                      </div>
                      <Trophy className="h-5 w-5 shrink-0 text-gold" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      {[1, 2, 3, 4].map((rank) => (
                        <button
                          key={rank}
                          onClick={() => setFinalRank(entry.name, entry.finalRank === rank ? null : rank)}
                          className={cn(
                            "flex-1 rounded-lg border px-2 py-2 text-sm font-bold transition-colors",
                            entry.finalRank === rank
                              ? "border-gold bg-gold text-gold-foreground"
                              : "border-input bg-background hover:bg-secondary",
                          )}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                    {entry.finalRank && (
                      <p className="mt-2 text-center text-xs font-semibold text-muted-foreground">
                        {RANK_LABELS[entry.finalRank]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {top4.some((e) => e.finalRank !== null) && (
              <div className="mt-6">
                <h3 className="font-display mb-3 text-lg font-bold">Final Results</h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((rank) => {
                    const winner = top4.find((e) => e.finalRank === rank);
                    if (!winner) return null;
                    return (
                      <div
                        key={rank}
                        className={cn(
                          "flex items-center gap-4 rounded-xl px-4 py-3",
                          RANK_STYLES[rank],
                        )}
                      >
                        <span className="font-display text-2xl font-extrabold">{rank}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{winner.name}</p>
                          <p className="text-xs opacity-80">{RANK_LABELS[rank]}</p>
                        </div>
                        <span className="font-display font-bold tabular-nums">{formatTime(winner.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PAGSIBOL: Pundasyon at Pagsinag ng mga Bagong Organisasyon at Lider sa LSPU-LB · Tally by Tech Team
      </footer>
    </div>
  );
}
