const SPOKEN_PUNCTUATION: Array<[RegExp, string]> = [
  [/\bquestion mark\b/gi, "?"],
  [/\bexclamation mark\b/gi, "!"],
  [/\bfull stop\b/gi, "."],
  [/\bperiod\b/gi, "."],
  [/\bcomma\b/gi, ","],
  [/\bsemicolon\b/gi, ";"],
  [/\bcolon\b/gi, ":"],
  [/\bapostrophe\b/gi, "'"],
  [/\bsingle quote\b/gi, "'"],
  [/\bdouble quote\b/gi, '"'],
  [/\bsingle cute\b/gi, "'"],
  [/\bdouble cute\b/gi, '"'],
  [/\bopen quote\b/gi, '"'],
  [/\bclose quote\b/gi, '"'],
  [/\bnew line\b/gi, "\n"],
  [/\bnew paragraph\b/gi, "\n\n"],
];

function cleanupPunctuationSpacing(text: string): string {
  return text
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])(\S)/g, "$1 $2")
    .replace(/(["'])\s+(\w)/g, "$1$2")
    .replace(/(\w)\s+(["'])(?=\s|[.,;:!?]|$)/g, "$1$2")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function applySpokenPunctuation(text: string): string {
  let result = text;

  for (const [pattern, symbol] of SPOKEN_PUNCTUATION) {
    result = result.replace(pattern, symbol);
  }

  return cleanupPunctuationSpacing(result);
}

export function normalizeTranscript(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function capitalizeSentenceLead(text: string): string {
  return text.replace(/^(["'(\[]*)([a-z])/, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function applySentenceContinuationCase(current: string, incoming: string): string {
  const trimmedCurrent = current.trimEnd();
  const shouldCapitalize = /[.!?]["')\]]?$/.test(trimmedCurrent);
  return shouldCapitalize ? capitalizeSentenceLead(incoming) : incoming;
}

export function appendCommittedTranscript(current: string, incoming: string): string {
  const punctuatedIncoming = applySpokenPunctuation(incoming);
  const normalizedIncoming = normalizeTranscript(punctuatedIncoming);

  if (!normalizedIncoming) {
    return current;
  }

  if (!current.trim()) {
    return capitalizeSentenceLead(normalizedIncoming);
  }

  const adjustedIncoming = applySentenceContinuationCase(current, normalizedIncoming);
  const separator = /[\s\n]$/.test(current) ? "" : " ";
  return `${current}${separator}${adjustedIncoming}`;
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function buildExportPayload(session: {
  id: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  status: string;
  transcript: string;
  durationMs: number;
}): string {
  return JSON.stringify(session, null, 2);
}