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
  unity?: number | null;
  unity1: number | null;
  unity2: number | null;
  integrity: number | null;
  stewardship: number | null;
  collaboration: number | null;
  final_rank: number | null;
  updated_at?: string;
}

export interface RankedScoreRow extends ScoreRow {
  total: number | null;
  insertedTotal: number | null;
  completedCount: number;
}

export const timesOf = (r: ScoreRow): Times => ({
  unity1: r.unity1,
  unity2: r.unity2,
  integrity: r.integrity,
  stewardship: r.stewardship,
  collaboration: r.collaboration,
});

export const UNITY_NULL_SENTINEL = 9999;
export const UNITY_MULTIPLIER = 10000;

export function decodeUnity(
  unity: number | null | undefined,
  unity1?: number | null | undefined,
  unity2?: number | null | undefined,
): { u1: number | null; u2: number | null } {
  // If dedicated columns exist and are explicitly set
  if (unity1 !== undefined && unity1 !== null) {
    return { u1: unity1, u2: unity2 ?? null };
  }
  if (unity2 !== undefined && unity2 !== null) {
    return { u1: null, u2: unity2 };
  }
  if (unity === null || unity === undefined) {
    return { u1: null, u2: null };
  }
  // Check if encoded (using multiplier 10000)
  if (unity >= UNITY_MULTIPLIER) {
    const raw1 = Math.floor(unity / UNITY_MULTIPLIER);
    const raw2 = unity % UNITY_MULTIPLIER;
    return {
      u1: raw1 === UNITY_NULL_SENTINEL ? null : raw1,
      u2: raw2 === UNITY_NULL_SENTINEL ? null : raw2,
    };
  }
  // Otherwise legacy single unity value: treat as Unity 1
  return { u1: unity, u2: null };
}

export function encodeUnity(u1: number | null, u2: number | null): number | null {
  if (u1 === null && u2 === null) return null;
  const part1 = u1 === null ? UNITY_NULL_SENTINEL : u1;
  const part2 = u2 === null ? UNITY_NULL_SENTINEL : u2;
  return part1 * UNITY_MULTIPLIER + part2;
}

function mapRawRow(raw: any): ScoreRow {
  const { u1, u2 } = decodeUnity(raw.unity, raw.unity_1 ?? raw.unity1, raw.unity_2 ?? raw.unity2);
  return {
    name: raw.name,
    sort_order: raw.sort_order ?? 0,
    unity: raw.unity ?? null,
    unity1: u1,
    unity2: u2,
    integrity: raw.integrity ?? null,
    stewardship: raw.stewardship ?? null,
    collaboration: raw.collaboration ?? null,
    final_rank: raw.final_rank ?? null,
    updated_at: raw.updated_at,
  };
}

const LOCAL_BACKUP_KEY = "pagsibol_scores_auto_backup";
const LOCAL_BACKUP_TIME_KEY = "pagsibol_scores_auto_backup_time";

export function saveAutoBackup(rows: ScoreRow[]) {
  if (typeof window === "undefined" || rows.length === 0) return;
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(rows));
    localStorage.setItem(LOCAL_BACKUP_TIME_KEY, new Date().toISOString());
  } catch (e) {
    console.error("Auto backup failed:", e);
  }
}

export function getAutoBackup(): { rows: ScoreRow[]; time: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(LOCAL_BACKUP_KEY);
    const time = localStorage.getItem(LOCAL_BACKUP_TIME_KEY);
    if (!data) return null;
    return { rows: JSON.parse(data), time };
  } catch (e) {
    return null;
  }
}

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
        if (active && data) {
          const parsed = data.map(mapRawRow);
          setRows(parsed);
          saveAutoBackup(parsed);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel("org_scores_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "org_scores" }, (payload) => {
        const raw = payload.new as any;
        if (!raw?.name) return;
        const row = mapRawRow(raw);
        setRows((prev) => {
          const next = prev.map((r) => (r.name === row.name ? row : r));
          saveAutoBackup(next);
          return next;
        });
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
      // 1. More completed stations ranks higher (e.g. 5/5 beats 4/5)
      if (a.completedCount !== b.completedCount) {
        return b.completedCount - a.completedCount;
      }
      // 2. If both have completed stations (>0), lowest time wins
      if (a.completedCount > 0 && b.completedCount > 0) {
        const timeA = (a.completedCount === 5 ? a.total : a.insertedTotal) ?? 0;
        const timeB = (b.completedCount === 5 ? b.total : b.insertedTotal) ?? 0;
        return timeA - timeB;
      }
      // 3. Otherwise maintain sort order
      return a.sort_order - b.sort_order;
    });
  }, [rows]);

  const top4 = useMemo(() => {
    return ranked
      .filter((r) => r.completedCount === 5 || (r.completedCount > 0 && r.insertedTotal !== null))
      .slice(0, 4);
  }, [ranked]);

  return { rows, setRows, ranked, top4, loading };
}

export async function saveTime(
  name: string,
  station: StationKey,
  value: number | null,
  currentRow?: ScoreRow,
) {
  if (station === "unity1" || station === "unity2") {
    const curU1 = station === "unity1" ? value : (currentRow?.unity1 ?? null);
    const curU2 = station === "unity2" ? value : (currentRow?.unity2 ?? null);
    const encoded = encodeUnity(curU1, curU2);

    // Try updating both dedicated columns and encoded unity
    const payloadWithColumns: Record<string, any> = {
      unity: encoded,
      unity_1: curU1,
      unity_2: curU2,
      updated_at: new Date().toISOString(),
    };

    const res = await supabase.from("org_scores").update(payloadWithColumns as any).eq("name", name);
    if (res.error) {
      // If unity_1/unity_2 columns don't exist in Supabase yet, fallback gracefully to unity
      await supabase
        .from("org_scores")
        .update({
          unity: encoded,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("name", name);
    }
  } else {
    await supabase
      .from("org_scores")
      .update({
        [station]: value,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("name", name);
  }
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
  const tryAll = await supabase
    .from("org_scores")
    .update({
      unity: null,
      unity_1: null,
      unity_2: null,
      integrity: null,
      stewardship: null,
      collaboration: null,
      final_rank: null,
    } as any)
    .neq("name", "");

  if (tryAll.error) {
    await supabase
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
}

export async function restoreFromBackup(backupRows: ScoreRow[]): Promise<boolean> {
  try {
    for (const r of backupRows) {
      const encoded = encodeUnity(r.unity1, r.unity2);
      const payload: Record<string, any> = {
        unity: encoded,
        integrity: r.integrity,
        stewardship: r.stewardship,
        collaboration: r.collaboration,
        final_rank: r.final_rank,
        updated_at: new Date().toISOString(),
      };
      const res = await supabase
        .from("org_scores")
        .update({
          ...payload,
          unity_1: r.unity1,
          unity_2: r.unity2,
        } as any)
        .eq("name", r.name);

      if (res.error) {
        await supabase.from("org_scores").update(payload as any).eq("name", r.name);
      }
    }
    saveAutoBackup(backupRows);
    return true;
  } catch (err) {
    console.error("Failed to restore backup:", err);
    return false;
  }
}
