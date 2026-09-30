export const STATIONS = [
  { key: "unity1", label: "Unity 1", short: "U1", full: "Ugat — Human Unity Transporter (Stage 1)" },
  { key: "unity2", label: "Unity 2", short: "U2", full: "Ugat — Human Unity Transporter (Stage 2)" },
  { key: "integrity", label: "Integrity", short: "Int", full: "Paninindigan — Krisis sa Kabilang Daan" },
  { key: "stewardship", label: "Stewardship", short: "Stew", full: "Katiwala — Tower of Purpose" },
  { key: "collaboration", label: "Collaboration", short: "Col", full: "Pagsinag — Tali ng Ugnayan" },
] as const;

export type StationKey = (typeof STATIONS)[number]["key"];

export const ORGANIZATIONS: string[] = [
  "Fishery Student Council",
  "Association of Hospitality Management and Tourism Students",
  "LSPU-LB Reserve Officers' Training Corps Unit",
  "CFND Student Organization",
  "College of Computer Studies - Student Council",
  "College of Teacher Education - Student Council",
  "Junior Financial Executives",
  "BTLED Society",
  "BEED Organization",
  "Social Studies Society",
  "Physical Education Society",
  "College of Criminal Justice Education Student Organization",
  "Psychology Society",
  "Ka-Peer Yu Organization",
  "Society of English Majors",
  "T.A.N.G.L.A.W.",
  "Kinetic Society",
  "BTVTED Society",
  "Mathematical Society",
  "Legion of Lures Esports",
  "Junior Philippine Institute of Accountants - Isometria",
  "Junior Marketing Association of the Philippines",
  "College of Business Administration and Accountancy - Student Council",
  "EsKultura: Eskwelahan ng Manlililok ng Kulturang Pilipino",
  "CO-Lab",
];

export type Times = Record<StationKey, number | null>; // seconds

export interface OrgEntry {
  name: string;
  times: Times;
  finalRank: number | null; // 1-4 after the Top 4 battle
}

export function emptyTimes(): Times {
  return {
    unity1: null,
    unity2: null,
    integrity: null,
    stewardship: null,
    collaboration: null,
  };
}

export function totalTime(t: Times): number | null {
  const vals = Object.values(t);
  if (vals.some((v) => v === null)) return null;
  return vals.reduce<number>((a, b) => a + (b as number), 0);
}

export function insertedTotalTime(t: Times): number | null {
  const vals = Object.values(t).filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce<number>((a, b) => a + b, 0);
}

export function completedStationsCount(t: Times): number {
  return Object.values(t).filter((v) => v !== null && v !== undefined).length;
}

export function unityCombinedTime(t: Times): number | null {
  if (t.unity1 === null && t.unity2 === null) return null;
  return (t.unity1 ?? 0) + (t.unity2 ?? 0);
}

export function formatTime(sec: number | null): string {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseTimeInput(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):([0-5]?\d)$/);
  if (match) return parseInt(match[1]!, 10) * 60 + parseInt(match[2]!, 10);
  const num = Number(trimmed);
  if (!isNaN(num) && num >= 0) return Math.round(num);
  return null;
}
