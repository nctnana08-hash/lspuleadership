import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { totalTime, type StationKey, type Times } from "@/lib/orgs";

export interface ScoreRow {
  name: string;
  sort_order: number;
  unity: number | null;
  integrity: number | null;
  stewardship: number | null;
  collaboration: number | null;
  final_rank: number | null;
}

export const timesOf = (r: ScoreRow): Times => ({
  unity: r.unity,
  integrity: r.integrity,
  stewardship: r.stewardship,
  collaboration: r.collaboration,
});

export function useScores() {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("org_scores")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (active && data) setRows(data as ScoreRow[]);
        setLoading(false);
      });
    const channel = supabase
      .channel("org_scores_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "org_scores" }, (payload) => {
        const row = payload.new as ScoreRow;
        if (!row?.name) return;
        setRows((prev) => prev.map((r) => (r.name === row.name ? row : r)));
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const ranked = useMemo(() => {
    const withTotal = rows.map((r) => ({ ...r, total: totalTime(timesOf(r)) }));
    const done = withTotal.filter((r) => r.total !== null).sort((a, b) => a.total! - b.total!);
    return [...done, ...withTotal.filter((r) => r.total === null)];
  }, [rows]);

  const top4 = useMemo(() => ranked.filter((r) => r.total !== null).slice(0, 4), [ranked]);

  return { rows, setRows, ranked, top4, loading };
}

export async function saveTime(name: string, station: StationKey, value: number | null) {
  const patch = { [station]: value, updated_at: new Date().toISOString() } as Partial<ScoreRow> & { updated_at: string };
  return supabase.from("org_scores").update(patch).eq("name", name);
}

export async function saveFinalRank(name: string, rank: number | null, rows: ScoreRow[]) {
  if (rank !== null) {
    const holder = rows.find((r) => r.final_rank === rank && r.name !== name);
    if (holder) await supabase.from("org_scores").update({ final_rank: null }).eq("name", holder.name);
  }
  return supabase.from("org_scores").update({ final_rank: rank }).eq("name", name);
}

export async function resetAll() {
  return supabase
    .from("org_scores")
    .update({ unity: null, integrity: null, stewardship: null, collaboration: null, final_rank: null })
    .neq("name", "");
}
