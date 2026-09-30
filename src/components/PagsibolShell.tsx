import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import bg from "@/assets/pagsibol-bg.jpg.asset.json";

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation Mode"}
      className="rounded-full border border-foreground/30 p-1.5 text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground"
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );
}

export function PagsibolShell({
  children,
  subtitle,
  compact = false,
  headerExtra,
}: {
  children: ReactNode;
  subtitle?: string;
  compact?: boolean;
  headerExtra?: ReactNode;
}) {
  if (compact) {
    return (
      <div className="relative h-screen max-h-screen w-full overflow-hidden text-foreground flex flex-col justify-between select-none">
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.url})` }}
          aria-hidden
        />
        <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden />

        {/* Compact Header */}
        <header className="glass shrink-0 border-b border-foreground/15 px-3 py-1.5 sm:px-5 sm:py-2">
          <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-display striped-title text-xl tracking-wider text-gold sm:text-2xl">
                PAGSIBOL
              </span>
              <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold sm:text-xs">
                2026
              </span>
              <span className="hidden font-display text-xs tracking-wider text-foreground/80 md:inline">
                LIVE LEADERBOARD
              </span>
            </div>

            {headerExtra ? (
              <div className="flex-1 min-w-0 max-w-2xl px-2">{headerExtra}</div>
            ) : (
              subtitle && (
                <p className="hidden text-xs text-foreground/80 lg:block truncate">{subtitle}</p>
              )
            )}

            <div className="flex items-center gap-2 shrink-0">
              <nav className="flex gap-1.5">
                {[
                  ["/", "Leaderboard"],
                  ["/tally", "Tally Board"],
                ].map(([to, label]) => (
                  <Link
                    key={to}
                    to={to as "/" | "/tally"}
                    activeOptions={{ exact: true }}
                    className="font-display rounded-full border border-foreground/30 px-3 py-1 text-xs uppercase tracking-wider transition-colors hover:bg-foreground/10"
                    activeProps={{
                      className: "bg-gold text-gold-foreground border-gold hover:bg-gold",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <FullscreenButton />
            </div>
          </div>
        </header>

        {/* Main Content strictly constrained to available viewport height */}
        <main className="flex-1 min-h-0 w-full max-w-[1920px] mx-auto p-2 sm:p-3 overflow-hidden flex flex-col">
          {children}
        </main>

        {/* Compact Footer */}
        <footer className="glass shrink-0 border-t border-foreground/10 px-4 py-1 text-[11px] text-foreground/60">
          <div className="mx-auto flex max-w-[1920px] items-center justify-between">
            <span className="hidden sm:inline">September 30, 2026 · Lacson Gymnasium</span>
            <span className="font-medium text-foreground/75">
              Laguna State Polytechnic University · Supreme Student Council – Los Baños
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <span className="live-dot" /> Live Standings
            </span>
          </div>
        </footer>
      </div>
    );
  }

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
        {subtitle && <p className="mt-2 text-sm text-foreground/80">{subtitle}</p>}
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
