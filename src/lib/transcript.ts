const SPOKEN_PUNCTUATION: Array<[RegExp, string]> = [
  [/\bquestion mark\b/gi, "?"],
  [/\bexclamation mark\b/gi, "!"],
  [/\bfull stop\b/gi, "."],
  [/\bdot\b/gi, "."],
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
  [/\bnext paragraph\b|\bnew paragraph\b/gi, "\n\n"],
  [/\bnext line\b|\bnew line\b|\bline break\b|\bnewline\b/gi, "\n"],
  [/\bopen\s+square\s+bracket\b|\bopen\s+bracket\b|\bleft bracket\b|\bopening bracket\b|\bsquare bracket open\b|\bleft square bracket\b/gi, "["],
  [/\bclose\s+(?:this\s+|that\s+)?square\s+bracket\b|\bclose\s+bracket\b|\bclosing bracket\b|\bsquare bracket close\b|\bright square bracket\b/gi, "]"],
  [/\bopen\s+round\s+bracket\b|\bopen\s+parenthesis\b|\bopen\s+\(\b|\bround bracket open\b|\bleft round bracket\b/gi, "("],
  [/\bclose\s+(?:this\s+|that\s+)?round\s+bracket\b|\bclose\s+parenthesis\b|\bclose\s+\)\b|\bround bracket close\b|\bright round bracket\b/gi, ")"],
  [/\bopen\s+curly\s+brace\b|\bopen\s+curly\s+bracket\b|\bopen\s+brace\b|\bopening brace\b|\bcurly bracket open\b|\bleft curly bracket\b/gi, "{"],
  [/\bclose\s+(?:this\s+|that\s+)?curly\s+brace\b|\bclose\s+curly\s+bracket\b|\bclose\s+brace\b|\bclosing brace\b|\bcurly bracket close\b|\bright curly bracket\b/gi, "}"],
  [/\bangle bracket\s+a\s+slash\s+b\s+angle bracket\b/gi, "<a/b>"],
  [/\bopen\s+angle\s+bracket\b|\bangle bracket open\b|\bleft angle bracket\b|\bless than\b/gi, "<"],
  [/\bclose\s+(?:this\s+|that\s+)?angle\s+bracket\b|\bclose\s+angle\s+bracket\b|\bangle bracket close\b|\bright angle bracket\b|\bgreater than\b/gi, ">"],
  [/\bslash\b|\bforward slash\b/gi, "/"],
  [/\bbackslash\b|\bbackward slash\b/gi, "\\"],
  [/\bplus sign\b|\bplus\b/gi, "+"],
  [/\bminus sign\b|\bdash\b|\bhyphen\b/gi, "-"],
  [/\bequal sign\b|\bequals\b/gi, "="],
  [/\basterisk\b|\bstar\b/gi, "*"],
  [/\bpercent sign\b|\bpercent\b/gi, "%"],
  [/\bhash\b|\bnumber sign\b/gi, "#"],
  [/\bat sign\b/gi, "@"],
  [/\bunderscore\b/gi, "_"],
  [/\bampersand\b|\band sign\b/gi, "&"],
  [/\bdollar sign\b|\bdollar\b/gi, "$"],
  [/\bpipe\b|\bvertical bar\b/gi, "|"],
  [/\bcaret\b/gi, "^"],
  [/\btilde\b/gi, "~"],
  [/\bbacktick\b/gi, "`"],
  [/\bexclamation point\b/gi, "!"],
  [/\bquestion point\b/gi, "?"],
  [/\bquote\b/gi, '"'],
  [/\bopen quote\b/gi, '"'],
  [/\bclose quote\b/gi, '"'],
  [/\bcomma\b/gi, ","],
];

function cleanupPunctuationSpacing(text: string): string {
  return text
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])([^\s])/g, "$1 $2")
    .replace(/\.(\s+)(com|org|net|io|co|uk|us|ca|in|edu|gov|me|info|app|dev|ai)/gi, ".$2")
    .replace(/([A-Za-z0-9\]])\s*([+-])\s*([A-Za-z0-9\[])/g, "$1 $2 $3")
    .replace(/\s+([@#$%*/\\<>\[\]{}()|_~`])/g, "$1")
    .replace(/([@#$%*/\\<>\[\]{}()|_~`])\s+/g, "$1")
    .replace(/(["'])\s+(\w)/g, "$1$2")
    .replace(/(\w)\s+(["'])(?=\s|[.,;:!?]|$)/g, "$1$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+/, "")
    .replace(/[ \t]+$/, "");
}

export function applySpokenPunctuation(text: string): string {
  let result = text;

  for (const [pattern, symbol] of SPOKEN_PUNCTUATION) {
    result = result.replace(pattern, symbol);
  }

  return cleanupPunctuationSpacing(result);
}

export function normalizeTranscript(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+/, "")
    .replace(/[ \t]+$/, "");
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
  const startsWithNewline = adjustedIncoming.startsWith("\n");
  const separator = startsWithNewline || /[\s\n]$/.test(current) ? "" : " ";
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