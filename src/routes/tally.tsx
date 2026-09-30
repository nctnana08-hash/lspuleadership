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
import {
  getAutoBackup,
  resetAll,
  restoreFromBackup,
  saveFinalRank,
  saveTime,
  timesOf,
  useScores,
  type RankedScoreRow,
  type ScoreRow,
} from "@/lib/scores";
import { cn } from "@/lib/utils";
import { Download, FileSpreadsheet, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import React, { useRef, useState } from "react";

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

function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJsonBackup(rows: ScoreRow[]) {
  const payload = {
    exportedAt: new Date().toISOString(),
    event: "PAGSIBOL 2026 Leadership Challenge",
    version: "2.0",
    totalOrganizations: rows.length,
    organizations: rows,
  };
  const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadFile(
    JSON.stringify(payload, null, 2),
    `pagsibol-scores-backup-${dateStr}.json`,
    "application/json",
  );
}

function exportCsvBackup(rows: RankedScoreRow[]) {
  const headers = [
    "Rank",
    "Organization",
    "Unity 1 (m:ss)",
    "Unity 2 (m:ss)",
    "Integrity (m:ss)",
    "Stewardship (m:ss)",
    "Collaboration (m:ss)",
    "Total Time (m:ss)",
    "Completed Stations",
    "Final Rank",
  ];
  const csvLines = [headers.join(",")];

  rows.forEach((r, idx) => {
    const rankNum = r.completedCount > 0 ? idx + 1 : "";
    const line = [
      rankNum,
      `"${r.name.replace(/"/g, '""')}"`,
      formatTime(r.unity1),
      formatTime(r.unity2),
      formatTime(r.integrity),
      formatTime(r.stewardship),
      formatTime(r.collaboration),
      formatTime(r.total ?? r.insertedTotal),
      `${r.completedCount}/5`,
      r.final_rank ?? "",
    ];
    csvLines.push(line.join(","));
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvLines.join("\n"), `pagsibol-scores-${dateStr}.csv`, "text/csv;charset=utf-8;");
}

function Tally() {
  const { rows, setRows, ranked, top4, loading } = useScores();
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onTime = (name: string, key: StationKey, raw: string) => {
    const v = parseTimeInput(raw);
    const currentRow = rows.find((r) => r.name === name);
    setRows((p) => p.map((r) => (r.name === name ? { ...r, [key]: v } : r)));
    saveTime(name, key, v, currentRow);
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

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const items: ScoreRow[] = Array.isArray(json) ? json : json.organizations;

        if (!Array.isArray(items) || items.length === 0) {
          alert("Invalid backup file: no organizations found.");
          return;
        }

        const confirmed = window.confirm(
          `Are you sure you want to restore scores for ${items.length} organizations from backup?\nThis will update live scores for all organizations.`,
        );
        if (!confirmed) return;

        setRestoring(true);
        const success = await restoreFromBackup(items);
        setRestoring(false);

        if (success) {
          setRows(items);
          alert(`Successfully restored scores for ${items.length} organizations!`);
        } else {
          alert("Failed to restore some or all scores. Check console for details.");
        }
      } catch (err) {
        alert("Error reading backup file. Make sure it is valid JSON.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreAutoBackup = async () => {
    const auto = getAutoBackup();
    if (!auto || auto.rows.length === 0) {
      alert("No local auto-backup found in this browser.");
      return;
    }
    const dateStr = auto.time ? new Date(auto.time).toLocaleTimeString() : "recently";
    const ok = window.confirm(
      `Restore ${auto.rows.length} organizations from local auto-backup saved at ${dateStr}?`,
    );
    if (!ok) return;

    setRestoring(true);
    const success = await restoreFromBackup(auto.rows);
    setRestoring(false);
    if (success) {
      setRows(auto.rows);
      alert("Local auto-backup restored successfully!");
    } else {
      alert("Failed to restore auto-backup.");
    }
  };

  const inputCls =
    "w-18 sm:w-20 rounded-md border border-foreground/30 bg-background/60 px-2 py-1.5 text-center tabular-nums focus:border-gold focus:outline-none";

  return (
    <PagsibolShell subtitle="Tally board · enter station times (e.g. 2:45) · saves instantly to the live leaderboard">
      {/* Backup and Data Management Toolbar */}
      <section className="glass mb-4 rounded-xl p-3 sm:p-4 border border-foreground/15 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-display text-xs uppercase tracking-wider text-foreground">
                Tally Board Backup &amp; Recovery
              </p>
              <p className="text-[11px] text-foreground/70">
                All changes are automatically backed up to local storage &amp; Supabase live.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportJsonBackup(rows)}
              title="Download JSON Backup"
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/30 bg-foreground/5 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/15 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-gold" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={() => exportCsvBackup(ranked)}
              title="Download CSV for Excel / Google Sheets"
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/30 bg-foreground/5 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/15 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              title="Restore from JSON Backup File"
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/30 bg-foreground/5 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/15 transition-colors disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 text-blue-400" />
              <span>{restoring ? "Restoring…" : "Restore Backup"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />

            <button
              onClick={handleRestoreAutoBackup}
              disabled={restoring}
              title="Recover latest browser auto-backup"
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/30 bg-foreground/5 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/15 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>Recover Auto-Backup</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Scoresheet Table */}
      <section className="glass overflow-x-auto rounded-2xl border border-foreground/15">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-foreground/20 text-left bg-background/50">
              <th className="font-display px-4 py-3 uppercase tracking-wider">Organization</th>
              {STATIONS.map((s) => (
                <th
                  key={s.key}
                  className="font-display px-2 py-3 text-center uppercase tracking-wider"
                  title={s.full}
                >
                  <div>{s.label}</div>
                  <div className="text-[10px] font-sans font-normal text-foreground/60">
                    {s.key === "unity1"
                      ? "Stage 1"
                      : s.key === "unity2"
                        ? "Stage 2"
                        : s.short}
                  </div>
                </th>
              ))}
              <th className="font-display px-4 py-3 text-right uppercase tracking-wider text-gold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-foreground/70">
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
                    "border-b border-foreground/10 last:border-0 hover:bg-foreground/[0.04]",
                    isTop && "bg-gold/15",
                  )}
                >
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  {STATIONS.map((s) => (
                    <td key={s.key} className="px-2 py-2 text-center">
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
                      <td className="font-display px-4 py-2 text-right text-base sm:text-lg tabular-nums">
                        {tot !== null ? (
                          <span className="text-gold font-bold">{formatTime(tot)}</span>
                        ) : insTot !== null ? (
                          <span className="text-foreground/90 font-medium">
                            {formatTime(insTot)}
                            <span className="ml-1 text-[11px] text-foreground/60 font-sans font-normal">
                              ({count}/5)
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

      {/* Top 4 Battle Section */}
      <section className="glass mt-8 rounded-2xl p-5 border border-foreground/15">
        <h2 className="font-display text-xl uppercase tracking-wider">
          Top 4 Battle — Assign Final Ranks
        </h2>
        <p className="mb-4 text-sm text-foreground/75">
          After the championship battle, assign each finalist their final place (Rank 1–4).
        </p>
        {top4.length < 4 ? (
          <p className="rounded-xl border border-dashed border-foreground/30 p-6 text-center text-foreground/70">
            Complete station times for at least 4 organizations to reveal the finalists.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {top4.map((e, i) => (
              <div key={e.name} className="rounded-xl bg-foreground/10 p-4 ring-1 ring-gold/60">
                <p className="text-xs uppercase tracking-wider text-foreground/70">
                  Qualifier #{i + 1} · {formatTime(e.total ?? e.insertedTotal)}
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

      {/* Reset Section */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() =>
            window.confirm(
              "Clear ALL station times and ranks for everyone? Make sure to click 'Export JSON Backup' first if you need a copy.",
            ) && resetAll()
          }
          className="rounded-full border border-destructive/40 bg-destructive/10 px-5 py-2 text-xs uppercase tracking-wider text-destructive-foreground hover:bg-destructive hover:text-white transition-colors"
        >
          Reset all scores
        </button>
      </div>
    </PagsibolShell>
  );
}
