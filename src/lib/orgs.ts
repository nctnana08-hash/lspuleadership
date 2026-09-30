export const STATIONS = [
  { key: "unity", label: "Unity", full: "Ugat — Human Unity Transporter" },
  { key: "integrity", label: "Integrity", full: "Paninindigan — Krisis sa Kabilang Daan" },
  { key: "stewardship", label: "Stewardship", full: "Katiwala — Tower of Purpose" },
  { key: "collaboration", label: "Collaboration", full: "Pagsinag — Tali ng Ugnayan" },
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
  return { unity: null, integrity: null, stewardship: null, collaboration: null };
}

export function totalTime(t: Times): number | null {
  const vals = Object.values(t);
  if (vals.some((v) => v === null)) return null;
  return vals.reduce<number>((a, b) => a + (b as number), 0);
}

export function formatTime(sec: number | null): string {
  if (sec === null) return "—";
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
