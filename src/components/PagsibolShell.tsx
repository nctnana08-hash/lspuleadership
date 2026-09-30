import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import bg from "@/assets/pagsibol-bg.jpg.asset.json";

export function PagsibolShell({ children, subtitle }: { children: ReactNode; subtitle: string }) {
  return (
    <div className="relative min-h-screen text-foreground">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg.url})` }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden />
      <header className="mx-auto max-w-6xl px-4 pt-8 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/80">
          Laguna State Polytechnic University · Supreme Student Council – Los Baños
        </p>
        <h1 className="font-display striped-title mt-3 text-6xl sm:text-8xl">PAGSIBOL</h1>
        <p className="font-display mt-2 text-sm uppercase tracking-wider sm:text-base">
          Pundasyon at Pagsinag ng mga Bagong Organisasyon at Lider sa LSPU-LB
        </p>
        <p className="mt-2 text-sm text-foreground/80">{subtitle}</p>
        <nav className="mt-5 flex justify-center gap-2">
          {[
            ["/", "Leaderboard"],
            ["/tally", "Tally Board"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to as "/" | "/tally"}
              activeOptions={{ exact: true }}
              className="font-display rounded-full border border-foreground/30 px-5 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-foreground/10"
              activeProps={{ className: "bg-gold text-gold-foreground border-gold hover:bg-gold" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="pb-6 text-center text-xs text-foreground/70">
        September 30, 2026 · Lacson Gymnasium
      </footer>
    </div>
  );
}
