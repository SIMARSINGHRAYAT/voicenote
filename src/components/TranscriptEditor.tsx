"use client";

import type { RefObject } from "react";

interface TranscriptEditorProps {
  value: string;
  interimText: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSelectionChange: (start: number, end: number) => void;
}

export function TranscriptEditor({
  value,
  interimText,
  onChange,
  textareaRef,
  onSelectionChange,
}: TranscriptEditorProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <label htmlFor="transcript-editor" className="mb-2 block text-sm font-medium text-slate-200">
        Transcript
      </label>
      <textarea
        id="transcript-editor"
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSelect={(event) => {
          const target = event.currentTarget;
          onSelectionChange(target.selectionStart ?? 0, target.selectionEnd ?? 0);
        }}
        onKeyUp={(event) => {
          const target = event.currentTarget;
          onSelectionChange(target.selectionStart ?? 0, target.selectionEnd ?? 0);
        }}
        onClick={(event) => {
          const target = event.currentTarget;
          onSelectionChange(target.selectionStart ?? 0, target.selectionEnd ?? 0);
        }}
        className="min-h-[320px] w-full resize-y rounded-xl border border-white/20 bg-black/40 p-4 text-base leading-relaxed text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/30"
        aria-describedby="interim-caption"
      />
      <p id="interim-caption" className="mt-3 min-h-6 text-sm text-slate-300" aria-live="polite">
        {interimText ? (
          <>
            <span className="font-medium text-cyan-200">Interim:</span>{" "}
            <span className="italic text-slate-100">{interimText}</span>
          </>
        ) : (
          "Live interim speech appears here while recording."
        )}
      </p>
    </section>
  );
}