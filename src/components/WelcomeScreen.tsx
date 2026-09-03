import Link from "next/link";

export function WelcomeScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-purple-600/35 blur-3xl" />
        <div className="absolute -right-20 bottom-2 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.28),rgba(7,17,31,0)_52%)]" />
      </div>

      <section className="relative w-full max-w-5xl text-center">
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">Live voice workspace</p>
        <h1 className="bg-[linear-gradient(110deg,#a78bfa_5%,#60a5fa_48%,#34d399_95%)] bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl lg:text-9xl">
          Voice Note
        </h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-lg font-medium text-blue-100 sm:text-2xl lg:text-3xl">
          <span>Real-Time Transcription</span>
          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
          <span>Instant Voice Notes</span>
          <span className="h-2 w-2 rounded-full bg-purple-300" aria-hidden="true" />
          <span>Privacy-First</span>
        </div>

        <div className="mt-12">
          <Link
            href="/dashboard?autostart=1"
            className="inline-flex items-center justify-center rounded-xl border border-blue-300/50 bg-[linear-gradient(110deg,#2563eb_0%,#7c3aed_52%,#059669_100%)] px-10 py-4 text-lg font-bold text-white shadow-[0_12px_40px_rgba(37,99,235,0.38)] transition hover:scale-[1.02] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Get Started <span className="ml-3" aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}