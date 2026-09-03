import type { LanguageOption } from "@/types/transcription";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "ja-JP", label: "Japanese" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
];

export const DEFAULT_LANGUAGE = "en-US";