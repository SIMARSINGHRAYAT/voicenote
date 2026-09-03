import type { RecorderStatus } from "@/types/transcription";

const STATUS_LABELS: Record<RecorderStatus, string> = {
  unsupported: "Unsupported Browser",
  ready: "Ready",
  "requesting-permission": "Requesting microphone access",
  listening: "Listening",
  paused: "Paused",
  reconnecting: "Reconnecting",
  stopping: "Stopping",
  "permission-denied": "Permission denied",
  "microphone-unavailable": "Microphone unavailable",
  error: "Error",
};

const STATUS_STYLE: Record<RecorderStatus, string> = {
  unsupported: "bg-amber-100 text-amber-900",
  ready: "bg-slate-200 text-slate-900",
  "requesting-permission": "bg-indigo-100 text-indigo-900",
  listening: "bg-emerald-100 text-emerald-900",
  paused: "bg-yellow-100 text-yellow-900",
  reconnecting: "bg-orange-100 text-orange-900",
  stopping: "bg-slate-300 text-slate-900",
  "permission-denied": "bg-rose-100 text-rose-900",
  "microphone-unavailable": "bg-rose-100 text-rose-900",
  error: "bg-rose-100 text-rose-900",
};

export function StatusBadge({ status }: { status: RecorderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
      aria-live="polite"
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}