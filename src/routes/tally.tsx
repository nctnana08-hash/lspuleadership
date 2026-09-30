import { createFileRoute } from "@tanstack/react-router";
import { PagsibolShell } from "@/components/PagsibolShell";
import {
  STATIONS,
  completedStationsCount,
  formatTime,
  insertedTotalTime,
  parseTimeInput,
  totalTime,
  type StationKey,
} from "@/lib/orgs";
import { resetAll, saveFinalRank, saveTime, timesOf, useScores } from "@/lib/scores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tally")({
  head: () => ({
    meta: [
      { title: "PAGSIBOL 2026 — Tally Board" },
      {
        name: "description",
        content: "Enter station times for each organization in the PAGSIBOL Leadership Challenge.",
      },
      { property: "og:title", content: "PAGSIBOL 2026 — Tally Board" },
      {
        property: "og:description",
        content: "Station time entry for the PAGSIBOL Leadership Challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tally,
});

function Tally() {
  const { rows, setRows, top4, loading } = useScores();

  const onTime = (name: string, key: StationKey, raw: string) => {
    const v = parseTimeInput(raw);
    setRows((p) => p.map((r) => (r.name === name ? { ...r, [key]: v } : r)));
    saveTime(name, key, v);
  };

  const onRank = (name: string, rank: number | null) => {
    setRows((p) =>
      p.map((r) => ({
        ...r,
        final_rank: r.name === name ? rank : r.final_rank === rank ? null : r.final_rank,
      })),
    );
    saveFinalRank(name, rank, rows);
  };

  const inputCls =
    "w-20 rounded-md border border-foreground/30 bg-background/60 px-2 py-1.5 text-center tabular-nums focus:border-gold focus:outline-none";

  return (
    <PagsibolShell subtitle="Tally board · enter times as m:ss (e.g. 2:45) · saves instantly to the live leaderboard">
      <section className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-foreground/20 text-left">
              <th className="font-display px-4 py-3 uppercase tracking-wider">Organization</th>
              {STATIONS.map((s) => (
                <th
                  key={s.key}
                  className="font-display px-3 py-3 uppercase tracking-wider"
                  title={s.full}
                >
                  {s.label}
                </th>
              ))}
              <th className="font-display px-4 py-3 text-right uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-foreground/70">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const isTop = top4.some((t) => t.name === r.name);
              return (
                <tr
                  key={r.name}
                  className={cn(
                    "border-b border-foreground/10 last:border-0",
                    isTop && "bg-gold/15",
                  )}
                >
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  {STATIONS.map((s) => (
                    <td key={s.key} className="px-3 py-2">
                      <input
                        key={`${r.name}-${s.key}-${r[s.key]}`}
                        inputMode="numeric"
                        placeholder="m:ss"
                        defaultValue={r[s.key] === null ? "" : formatTime(r[s.key])}
                        onBlur={(e) => {
                          if (parseTimeInput(e.target.value) !== r[s.key])
                            onTime(r.name, s.key, e.target.value);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.target as HTMLInputElement).blur()
                        }
                        className={inputCls}
                      />
                    </td>
                  ))}
                  {(() => {
                    const tOfR = timesOf(r);
                    const tot = totalTime(tOfR);
                    const insTot = insertedTotalTime(tOfR);
                    const count = completedStationsCount(tOfR);
                    return (
                      <td className="font-display px-4 py-2 text-right text-lg tabular-nums">
                        {tot !== null ? (
                          <span className="text-gold font-bold">{formatTime(tot)}</span>
                        ) : insTot !== null ? (
                          <span className="text-foreground/90 font-medium">
                            {formatTime(insTot)}
                            <span className="ml-1 text-[11px] text-foreground/60 font-sans font-normal">
                              ({count}/4)
                            </span>
                          </span>
                        ) : (
                          <span className="text-foreground/40">—</span>
                        )}
                      </td>
                    );
                  })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="glass mt-8 rounded-2xl p-5">
        <h2 className="font-display text-xl uppercase tracking-wider">
          Top 4 Battle — Assign Final Ranks
        </h2>
        <p className="mb-4 text-sm text-foreground/75">
          After the battle, pick each finalist's final place.
        </p>
        {top4.length < 4 ? (
          <p className="rounded-xl border border-dashed border-foreground/30 p-6 text-center text-foreground/70">
            Complete times for at least 4 organizations to reveal the finalists.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {top4.map((e, i) => (
              <div key={e.name} className="rounded-xl bg-foreground/10 p-4 ring-1 ring-gold/60">
                <p className="text-xs uppercase tracking-wider text-foreground/70">
                  Qualifier #{i + 1} · {formatTime(e.total)}
                </p>
                <p className="mt-1 font-semibold">{e.name}</p>
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => onRank(e.name, e.final_rank === rank ? null : rank)}
                      className={cn(
                        "font-display flex-1 rounded-lg border px-2 py-2 text-lg transition-colors",
                        e.final_rank === rank
                          ? "border-gold bg-gold text-gold-foreground"
                          : "border-foreground/30 hover:bg-foreground/10",
                      )}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 text-center">
        <button
          onClick={() =>
            window.confirm("Clear ALL times and ranks for everyone? This cannot be undone.") &&
            resetAll()
          }
          className="rounded-full border border-foreground/30 px-5 py-2 text-xs uppercase tracking-wider text-foreground/80 hover:bg-destructive hover:text-destructive-foreground"
        >
          Reset all scores
        </button>
      </div>
    </PagsibolShell>
  );
}
