import Link from "next/link";

export function WelcomeScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-fuchsia-500/22 blur-3xl" />
        <div className="absolute -right-20 bottom-2 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),rgba(0,0,0,0)_45%)]" />
      </div>

      <section className="relative w-full max-w-5xl text-center">
        <div className="mb-6 flex justify-center">
          <img src="/voice-notes-microphone-icon.png" alt="Voice Note microphone logo" className="h-24 w-24 object-contain sm:h-32 sm:w-32" />
        </div>
        <h1 className="bg-[linear-gradient(180deg,#f4f6f8_0%,#c5ccd3_30%,#8e98a3_52%,#e7ebef_74%,#b9c0c8_100%)] bg-clip-text text-6xl font-semibold tracking-tight text-transparent sm:text-8xl">
          Voice Note
        </h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-lg font-medium sm:text-2xl">
          <span className="bg-[linear-gradient(180deg,#f4f6f8_0%,#c5ccd3_30%,#8e98a3_52%,#e7ebef_74%,#b9c0c8_100%)] bg-clip-text text-transparent">Real-Time Transcription</span>
          <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="bg-[linear-gradient(180deg,#f4f6f8_0%,#c5ccd3_30%,#8e98a3_52%,#e7ebef_74%,#b9c0c8_100%)] bg-clip-text text-transparent">Instant Voice Notes</span>
          <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="bg-[linear-gradient(180deg,#f4f6f8_0%,#c5ccd3_30%,#8e98a3_52%,#e7ebef_74%,#b9c0c8_100%)] bg-clip-text text-transparent">Privacy-First</span>
        </div>

        <div className="mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300/40 bg-[linear-gradient(180deg,#eef2f5_0%,#9ca5af_40%,#dfe4e8_70%,#8d98a3_100%)] px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_35px_rgba(255,255,255,0.18)] transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}