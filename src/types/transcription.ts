export type RecorderStatus =
  | "unsupported"
  | "ready"
  | "requesting-permission"
  | "listening"
  | "paused"
  | "reconnecting"
  | "stopping"
  | "permission-denied"
  | "microphone-unavailable"
  | "error";

export interface LanguageOption {
  code: string;
  label: string;
}

export interface TranscriptState {
  committedText: string;
  interimText: string;
}

export interface TranscriptionSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  durationMs: number;
  status: RecorderStatus;
  transcript: string;
}

export interface SpeechHookState extends TranscriptState {
  status: RecorderStatus;
  errorMessage: string | null;
  isSupported: boolean;
  isSecureContext: boolean;
  audioLevel: number;
  durationMs: number;
}

export interface SpeechControls {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  clear: () => void;
  setLanguage: (language: string) => void;
}

export type SpeechRecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed";