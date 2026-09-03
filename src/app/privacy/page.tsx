export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-slate-100 sm:px-10">
      <article className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">VOICE NOTE MEMO</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-400">Last updated: September 3, 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Overview</h2>
          <p className="leading-7 text-slate-300">
            VOICE NOTE MEMO is a real-time speech-to-text application. We designed it to keep your voice notes under
            your control and do not require an account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Information and permissions</h2>
          <p className="leading-7 text-slate-300">
            When you choose Start Speaking, the app requests microphone access and sends audio to the speech
            recognition service provided by your browser. Depending on your browser and its configuration, that
            service may process audio through the browser vendor&apos;s speech systems.
          </p>
          <p className="leading-7 text-slate-300">
            The app may store saved message text in your browser&apos;s local storage on your device. We do not upload raw
            recordings or saved messages to our servers by default. The app may also use clipboard access when you
            choose Copy, and download files when you choose an export action.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">How information is used</h2>
          <p className="leading-7 text-slate-300">
            Microphone audio is used only to provide the speech-to-text feature you request. Transcript text is used to
            display, edit, copy, save locally, and export your notes. We do not sell personal information or use voice
            recordings for advertising.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Your choices</h2>
          <p className="leading-7 text-slate-300">
            You can deny microphone permission, stop recognition, clear the current session, or remove saved messages
            through your browser settings and the app controls. You can also clear the site&apos;s local storage through
            your browser settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p className="leading-7 text-slate-300">
            For privacy questions, contact the publisher through the support contact details provided with the product
            listing.
          </p>
        </section>
      </article>
    </main>
  );
}
