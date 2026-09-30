import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  completedStationsCount,
  insertedTotalTime,
  totalTime,
  type StationKey,
  type Times,
} from "@/lib/orgs";

export interface ScoreRow {
  name: string;
  sort_order: number;
  unity: number | null;
  integrity: number | null;
  stewardship: number | null;
  collaboration: number | null;
  final_rank: number | null;
}

export interface RankedScoreRow extends ScoreRow {
  total: number | null;
  insertedTotal: number | null;
  completedCount: number;
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

  const ranked = useMemo<RankedScoreRow[]>(() => {
    const withTotal: RankedScoreRow[] = rows.map((r) => {
      const times = timesOf(r);
      const total = totalTime(times);
      const insertedTotal = insertedTotalTime(times);
      const completedCount = completedStationsCount(times);
      return {
        ...r,
        total,
        insertedTotal,
        completedCount,
      };
    });

    return withTotal.sort((a, b) => {
      // 1. More completed stations ranks higher (e.g. 4/4 beats 3/4)
      if (a.completedCount !== b.completedCount) {
        return b.completedCount - a.completedCount;
      }
      // 2. If both have completed stations (>0), lowest time wins
      if (a.completedCount > 0 && b.completedCount > 0) {
        const timeA = (a.completedCount === 4 ? a.total : a.insertedTotal) ?? 0;
        const timeB = (b.completedCount === 4 ? b.total : b.insertedTotal) ?? 0;
        return timeA - timeB;
      }
      // 3. Otherwise maintain sort order
      return a.sort_order - b.sort_order;
    });
  }, [rows]);

  const top4 = useMemo(() => {
    return ranked
      .filter((r) => r.completedCount === 4 || (r.completedCount > 0 && r.insertedTotal !== null))
      .slice(0, 4);
  }, [ranked]);

  return { rows, setRows, ranked, top4, loading };
}

export async function saveTime(name: string, station: StationKey, value: number | null) {
  const patch = { [station]: value, updated_at: new Date().toISOString() } as Partial<ScoreRow> & {
    updated_at: string;
  };
  return supabase.from("org_scores").update(patch).eq("name", name);
}

export async function saveFinalRank(name: string, rank: number | null, rows: ScoreRow[]) {
  if (rank !== null) {
    const holder = rows.find((r) => r.final_rank === rank && r.name !== name);
    if (holder)
      await supabase.from("org_scores").update({ final_rank: null }).eq("name", holder.name);
  }
  return supabase.from("org_scores").update({ final_rank: rank }).eq("name", name);
}

export async function resetAll() {
  return supabase
    .from("org_scores")
    .update({
      unity: null,
      integrity: null,
      stewardship: null,
      collaboration: null,
      final_rank: null,
    })
    .neq("name", "");
}
