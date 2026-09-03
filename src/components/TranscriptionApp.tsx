"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioLevelMeter } from "@/components/AudioLevelMeter";
import { StatusBadge } from "@/components/StatusBadge";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { buildExportPayload, formatDuration } from "@/lib/transcript";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { TranscriptionSession } from "@/types/transcription";

interface SavedMessage {
  id: string;
  name: string;
  transcript: string;
  createdAt: string;
}

const SAVED_MESSAGES_KEY = "voice-note-saved-messages";

function createSession(): TranscriptionSession {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    language: "en-US",
    durationMs: 0,
    status: "ready",
    transcript: "",
  };
}

function downloadBlob(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function capitalizeLeadForInsertion(prefix: string, text: string): string {
  const shouldCapitalize = /[.!?]["')\]]?$/.test(prefix.trimEnd());
  if (!shouldCapitalize) {
    return text;
  }

  return text.replace(/^(["'(\[]*)([a-z])/, (_, p1: string, p2: string) => `${p1}${p2.toUpperCase()}`);
}

function insertAtCaret(base: string, incomingText: string, start: number, end: number) {
  let textToInsert = incomingText.trim();
  if (!textToInsert) {
    return { nextValue: base, nextCaret: start };
  }

  const safeStart = Math.max(0, Math.min(start, base.length));
  const safeEnd = Math.max(safeStart, Math.min(end, base.length));

  const prefix = base.slice(0, safeStart);
  const suffix = base.slice(safeEnd);

  textToInsert = capitalizeLeadForInsertion(prefix, textToInsert);

  if (prefix && !/[ \n]$/.test(prefix) && !/^[,.;:!?]/.test(textToInsert)) {
    textToInsert = ` ${textToInsert}`;
  }

  if (suffix && !/^[\s,.;:!?]/.test(suffix) && !/[ \n]$/.test(textToInsert)) {
    textToInsert = `${textToInsert} `;
  }

  const nextValue = `${prefix}${textToInsert}${suffix}`;
  const nextCaret = (prefix + textToInsert).length;

  return { nextValue, nextCaret };
}

export function TranscriptionApp() {
  const { state, start, pause, resume, stop, clear, setLanguage } = useSpeechRecognition();

  const [session, setSession] = useState<TranscriptionSession>(() => createSession());
  const [editorValue, setEditorValue] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [savedCopyId, setSavedCopyId] = useState<string | null>(null);
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [messageName, setMessageName] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const caretRef = useRef({ start: 0, end: 0 });
  const lastCommittedRef = useRef("");

  const updateCaret = useCallback((start: number, end: number) => {
    caretRef.current = { start, end };
  }, []);

  useEffect(() => {
    setLanguage("en-US");
  }, [setLanguage]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_MESSAGES_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as SavedMessage[];
      if (Array.isArray(parsed)) {
        setSavedMessages(parsed);
      }
    } catch {
      setSavedMessages([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_MESSAGES_KEY, JSON.stringify(savedMessages));
  }, [savedMessages]);

  useEffect(() => {
    setSession((previous) => ({
      ...previous,
      updatedAt: new Date().toISOString(),
      durationMs: state.durationMs,
      status: state.status,
      language: "en-US",
    }));
  }, [state.durationMs, state.status]);

  useEffect(() => {
    const previousCommitted = lastCommittedRef.current;
    const incomingCommitted = state.committedText;

    if (!incomingCommitted) {
      lastCommittedRef.current = "";
      return;
    }

    let delta = "";

    if (!previousCommitted) {
      delta = incomingCommitted;
    } else if (incomingCommitted.startsWith(previousCommitted)) {
      delta = incomingCommitted.slice(previousCommitted.length).trimStart();
    } else if (incomingCommitted !== previousCommitted) {
      delta = incomingCommitted;
    }

    if (delta) {
      setEditorValue((current) => {
        const { nextValue, nextCaret } = insertAtCaret(
          current,
          delta,
          caretRef.current.start,
          caretRef.current.end,
        );

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(nextCaret, nextCaret);
          }
          updateCaret(nextCaret, nextCaret);
        });

        return nextValue;
      });
    }

    lastCommittedRef.current = incomingCommitted;
  }, [state.committedText, updateCaret]);

  useEffect(() => {
    setSession((previous) => ({
      ...previous,
      transcript: editorValue,
      updatedAt: new Date().toISOString(),
    }));
  }, [editorValue]);

  const canStart = state.status === "ready" || state.status === "paused" || state.status === "error";
  const canPause = state.status === "listening";
  const canResume = state.status === "paused";
  const canStop =
    state.status === "listening" || state.status === "paused" || state.status === "reconnecting";

  const transcriptWithInterim = useMemo(() => {
    if (!state.interimText) {
      return editorValue;
    }

    return editorValue ? `${editorValue} ${state.interimText}` : state.interimText;
  }, [editorValue, state.interimText]);

  const armRecordingInsertionPoint = () => {
    if (!textareaRef.current) {
      return;
    }

    const startPos = textareaRef.current.selectionStart ?? editorValue.length;
    const endPos = textareaRef.current.selectionEnd ?? editorValue.length;
    updateCaret(startPos, endPos);
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcriptWithInterim.trim());
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
    }
  };

  const storeMessage = () => {
    const transcript = editorValue.trim();
    if (!transcript || canStop) {
      return;
    }

    const resolvedName = messageName.trim() || `Message ${savedMessages.length + 1}`;

    setSavedMessages((previous) => [
      {
        id: crypto.randomUUID(),
        name: resolvedName,
        transcript,
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]);

    setMessageName("");
  };

  const loadMessageIntoEditor = (transcript: string) => {
    setEditorValue(transcript);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const end = transcript.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(end, end);
        updateCaret(end, end);
      }
    });
  };

  const copySavedMessage = async (message: SavedMessage) => {
    try {
      await navigator.clipboard.writeText(message.transcript);
      setSavedCopyId(message.id);
      window.setTimeout(() => setSavedCopyId(null), 1500);
    } catch {
      setCopyState("error");
    }
  };

  const deleteSavedMessage = (id: string) => {
    setSavedMessages((previous) => previous.filter((message) => message.id !== id));
  };

  const startNewSession = () => {
    if (canStop) {
      stop();
    }

    clear();
    setEditorValue("");
    setSession(createSession());
    setCopyState("idle");
    lastCommittedRef.current = "";
    updateCaret(0, 0);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(0,0,0,0)_45%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[2.1fr_1fr]">
        <section className="space-y-4">
          <TranscriptEditor
            value={editorValue}
            interimText={state.interimText}
            onChange={setEditorValue}
            textareaRef={textareaRef}
            onSelectionChange={updateCaret}
          />

          <section className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={messageName}
                onChange={(event) => setMessageName(event.target.value)}
                maxLength={64}
                className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/30"
                aria-label="Saved message name"
              />
              <button
                type="button"
                onClick={storeMessage}
                disabled={!editorValue.trim() || canStop}
                className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Store Message
              </button>
            </div>

            <div className="space-y-2">
              {savedMessages.length === 0 ? (
                <p className="text-sm text-slate-300">Stored voice messages will appear here.</p>
              ) : (
                savedMessages.map((message) => (
                  <article
                    key={message.id}
                    className="rounded-xl border border-white/15 bg-black/35 p-3 text-slate-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-cyan-200">{message.name}</h3>
                        <p className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copySavedMessage(message)}
                          className="rounded-md border border-white/20 px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          {savedCopyId === message.id ? "Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadMessageIntoEditor(message.transcript)}
                          className="rounded-md border border-white/20 px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedMessage(message.id)}
                          className="rounded-md border border-rose-300/40 px-2 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 max-h-16 overflow-hidden text-sm text-slate-200">{message.transcript}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        <aside className="space-y-4 rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <StatusBadge status={state.status} />
            <p className="text-sm font-medium text-slate-200">{formatDuration(state.durationMs)}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-200">Mic Activity</p>
            <AudioLevelMeter level={state.audioLevel} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={canResume ? () => {
                armRecordingInsertionPoint();
                resume();
              } : async () => {
                armRecordingInsertionPoint();
                await start();
              }}
              disabled={!canStart && !canResume}
              className="col-span-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {canResume ? "Resume" : "Start Speaking"}
            </button>
            <button
              type="button"
              onClick={pause}
              disabled={!canPause}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={stop}
              disabled={!canStop}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Stop
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/20 pt-3">
            <button
              type="button"
              onClick={copyTranscript}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => downloadBlob(transcriptWithInterim || "", `transcript-${session.id}.txt`, "text/plain")}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Download TXT
            </button>
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  buildExportPayload({ ...session, transcript: transcriptWithInterim }),
                  `transcript-${session.id}.json`,
                  "application/json",
                )
              }
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Download JSON
            </button>
            <button
              type="button"
              onClick={startNewSession}
              className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
            >
              New Session
            </button>
          </div>

          {(state.errorMessage || !state.isSecureContext || !state.isSupported || copyState === "error") && (
            <div className="rounded-lg border border-amber-200/40 bg-amber-200/10 p-3 text-sm text-amber-100" role="status">
              {!state.isSecureContext && <p>Microphone features require HTTPS (or localhost) for browser security.</p>}
              {!state.isSupported && (
                <p>
                  This browser does not support the Web Speech API. Use the latest Chrome, Edge, or Safari for live
                  transcription.
                </p>
              )}
              {state.errorMessage && <p>{state.errorMessage}</p>}
              {copyState === "error" && <p>Clipboard access failed. Please copy manually from the transcript box.</p>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}